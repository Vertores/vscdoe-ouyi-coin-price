import { window } from 'vscode'

export async function showQuickPick() {
	const result = await window.showQuickPick(['BTC-USDT-SWAP', 'ETH-USDT-SWAP', 'ETC-USDT-SWAP', "DOGE-USDT-SWAP",'OKB-USDT-SWAP','OKT-USDT-SWAP','LTC-USDT-SWAP'], {
		placeHolder: '请选择要获取的永续货币行情',
	});
	return result
}

/**
 * Shows an input box using window.showInputBox().
 */
export async function showInputBox() {
	const result = await window.showInputBox({
		value: '',
		placeHolder: '例如:ETH-USDT为货币价格,ETH-USDT-SWAP为永续合约',
	});
	return result;
}