

module.exports = {
	default: function(_context) { 
		return {
			plugin: function (md, _options) {
                console.log(_options)
                const contentScriptId = _context.contentScriptId;
            
                function render_footnote_block_open2(tokens, idx, options) {
                    
                    const postMessageWithResponseTest = `
                    console.log('sending message');
                    webviewApi.postMessage('${contentScriptId}', {type:'getContent'}).then(function(response) {
                        console.info('Got response in Markdown-it content script: ' + response);
                        document.getElementById('backs').innerHTML=response;
                    });
                    return false;
                `;
                    //return `<div id="backref">back</div><a href="#" onclick="let cont='asdf';async function a(){cont=await webviewApi.executeCommand('getFun');webviewApi.executeCommand('getFun').then(res=>console.log(res));document.getElementById('backref').innerHTML=cont};a();">asdf</a>`
                  return `
                    <div id="backs"></div>
                    <style onload="${postMessageWithResponseTest.replace(/\n/g, ' ')}"/>
                `;
                //return `<div id="backref">back</div><a href="#" onclick="document.getElementById('backref').innerHTML='myasdf';">asdf</a>`
                    
                  }
                  
            
                md.renderer.rules.footnote_block_open2   = render_footnote_block_open2;
                
            
                function footnote_tail2(state) {
             
            
                    let token = new state.Token('footnote_block_open2', '', 0);
                    
                    state.tokens.push(token);
                    console.log("foot tokens");
                    console.log(state.tokens);

              }
              md.core.ruler.after('inline', 'footnote_tail2', footnote_tail2);
            
                /*
                var defaultRender = md.renderer.rules.text;
                md.renderer.rules.text =
                function (tokens, idx, options, env, self) {
                    var token = tokens[idx];
                    console.log(token);
                    console.log(idx)
                    console.log("-------");
                    console.log(tokens.length);
                    if(idx==0){
                        
                        //token.attrs.push(['js', "webviewApi.executeCommand('testCommand', 'one', 'two'); return false;"]);
                        let first = md.utils.escapeHtml(token.content)
                        let replacement={html:`${first}<h1>ADFS</h1>`}
                
                        return replacement.html;
                        
                        
                    }
            
            
                    return defaultRender(tokens, idx, options, env, self);
                    
                }
                */
                
            }
            
			
		}
	},
}