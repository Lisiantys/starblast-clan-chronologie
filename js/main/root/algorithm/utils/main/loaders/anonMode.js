/*
  Toggle anonymous mode (processing code)
*/

let t = WebSocket.prototype.send;
WebSocket.prototype.send = function (msg) {
  try {
    let parsed;
    if (localStorage.getItem('anonMode') != 'true' || (parsed = JSON.parse(msg)) == null || parsed.data == null || !parsed.data.hasOwnProperty("ecp_key")) throw "sus";
    parsed.data.ecp_key = parsed.data.steamid = null;
    arguments[0] = JSON.stringify(parsed);
  }
  catch (e) {}

  return t.apply(this, arguments);
}
