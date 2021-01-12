
function plugin(md, _options) {
    console.log(_options)
    const contentScriptId = context.contentScriptId;

    function render_footnote_block_open2(tokens, idx, options) {
        
        const postMessageWithResponseTest = `
        webviewApi.postMessage('${contentScriptId}', {type:'getContent'}).then(function(response) {
            console.info('Got response in Markdown-it content script: ' + response);
            document.getElementById('backs').innerHTML=response
        });
        return false;
    `;
        //return `<div id="backref">back</div><a href="#" onclick="let cont='asdf';async function a(){cont=await webviewApi.executeCommand('getFun');webviewApi.executeCommand('getFun').then(res=>console.log(res));document.getElementById('backref').innerHTML=cont};a();">asdf</a>`
      return `
        <div style="padding:10px; border: 1px solid green;">
            <p><a href="#" onclick="${postMessageWithResponseTest.replace(/\n/g, ' ')}">Click to post a message to plugin and check the response in the console</a></p>
        </div>
        <div id="backs"></div>
        <style onload="${postMessageWithResponseTest.replace(/\n/g, ' ')}"/>
    `;
    //return `<div id="backref">back</div><a href="#" onclick="document.getElementById('backref').innerHTML='myasdf';">asdf</a>`
        
      }
      

    md.renderer.rules.footnote_block_open2   = render_footnote_block_open2;
    

    function footnote_tail2(state) {
 

        token = new state.Token('footnote_block_open2', '', 1);
        state.tokens.push(token);
  }
  md.core.ruler.after('inline', 'footnote_tail2', footnote_tail2);

    /*
    var defaultRender = markdownIt.renderer.rules.text;
    markdownIt.renderer.rules.text =
    function (tokens, idx, options, env, self) {
        var token = tokens[idx];
        console.log(token);
        console.log(idx)
        console.log("-------");
        console.log(tokens.length);
        if(idx==1){
            
            //token.attrs.push(['js', "webviewApi.executeCommand('testCommand', 'one', 'two'); return false;"]);
            let replacement={html:"<h1>ADFS</h1>"}
    
            return replacement.html;
            
            
        }


        return defaultRender(tokens, idx, options, env, self);
        
    }
    */
}

module.exports = {
	default: function(_context) { 
		return {
			plugin: plugin,
			
		}
	},
}