import * as vscode from 'vscode';
import { WebSocket } from 'ws';
import { showInputBox, showQuickPick } from './baseInput';
let myStatusBarItem: vscode.StatusBarItem;
const WS_URL = 'wss://wspri.coinall.ltd:8443/ws/v5/ipublic';
let ws: WebSocket;
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('cybermoney.GETCOINPICRE', async () => {
		const options: { [key: string]: (context: vscode.ExtensionContext) => Promise<any> } = {
			'快速选择常见的币种行情': showQuickPick,
			'手动输入要获取币种行情': showInputBox,
			'关闭连接':manualCloseWebsocket
		};
		const quickPick = vscode.window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({ label }));
		quickPick.onDidChangeSelection(selection => {
			if (selection[0].label == '关闭连接') {
			   closeWebsocket(ws)
			   quickPick.hide()
			} else {
				options[selection[0].label](context).then(res => {
					if (!res) {
						vscode.window.showInformationMessage('请输入要获取的货币行情')
						return
					}
					getCoinPrice(res)
				}).catch(console.error);
			}
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	}));
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	myStatusBarItem.command = 'cybermoney.GETCOINPICRE';
	context.subscriptions.push(myStatusBarItem);
	myStatusBarItem.text = '点击获取货币行情';
	myStatusBarItem.show();
}
async function manualCloseWebsocket()  {
	 let res = await Promise.resolve('close')
	 return res
}
function getCoinPrice(result: string) {
	if (ws && ws.readyState === ws.OPEN) {
		closeWebsocket(ws);
	}
	ws = initWebsocket(result);
}
export function deactivate() { }

function closeWebsocket(ws: WebSocket) {
	ws.close();
	vscode.window.showInformationMessage('连接已关闭');
	myStatusBarItem.text = '点击获取货币行情';
}

function initWebsocket(INST_ID: string) {
	const ws = new WebSocket(WS_URL);
	ws.on('close', function close () {
		myStatusBarItem.text = '点击获取货币行情'
	})
	ws.on('open', function open() {
		myStatusBarItem.text = '连接成功';
		ws.send(JSON.stringify({ op: 'subscribe', args: [{ channel: 'tickers', instId: INST_ID }] }));
	});
	ws.on('error', function error() {
		vscode.window.showErrorMessage(`连接失败，请尝试重新连接`)
	})
	ws.on('message', function message(buffer) {
		const res = buffer.toString('utf8');
		let rsg = JSON.parse(res);
		if (rsg.event == 'error') {
		  vscode.window.showErrorMessage(`获取行情失败，请确认输入了正确的币种名称${INST_ID}`)
		  myStatusBarItem.text = '点击重新选择获取'
		}
		if (rsg.data) {
			let last = Number(rsg.data[0].last);
			let sodUtc8 = Number(rsg.data[0].sodUtc8);
			let diff = 0;
			let percent = '';
			if (last > sodUtc8) {
				diff = last - sodUtc8;
				percent = (diff / sodUtc8 * 100).toFixed(2) + "%";
				myStatusBarItem.color = '#F56C6C';
			} else {
				diff = sodUtc8 - last;
				percent = '-' + (diff / sodUtc8 * 100).toFixed(2) + "%";
				myStatusBarItem.color = '#67C23A';
			}
			myStatusBarItem.text = `${INST_ID}-${rsg.data[0].last}/${percent}`;
		}

	});
	return ws;
}