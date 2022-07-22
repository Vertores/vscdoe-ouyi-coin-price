import * as vscode from 'vscode';
import { WebSocket } from 'ws';
let myStatusBarItem: vscode.StatusBarItem;
const WS_URL = 'wss://wspri.coinall.ltd:8443/ws/v5/ipublic';
const INST_ID = 'ETH-USDT-SWAP';
let ws: WebSocket
export function activate(context: vscode.ExtensionContext) {

	const myCommandId = 'cybermoney.ETH';
	context.subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		if (ws && ws.readyState === ws.OPEN) {
           CloseWebsocket(ws);
		} else {
	     ws = initWebsocket();
		}
	   
	}));
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	myStatusBarItem.command = myCommandId;
	context.subscriptions.push(myStatusBarItem);
	myStatusBarItem.text = '点击连接';
	myStatusBarItem.show();
	

}

export function deactivate() { }


function CloseWebsocket(ws: WebSocket) {
    ws.close();
	vscode.window.showInformationMessage('连接已关闭');
	myStatusBarItem.text = '点击连接';
}

function initWebsocket() {
	const ws = new WebSocket(WS_URL);
	ws.on('open', function open() {
		myStatusBarItem.text = 'websocket连接成功';
		ws.send(JSON.stringify({ op: 'subscribe', args: [{ channel: 'tickers', instId: INST_ID }] }));
	});
	ws.on('message', function message(buffer) {
		const res = buffer.toString('utf8');
		let rsg = JSON.parse(res);
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