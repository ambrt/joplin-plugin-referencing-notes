import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation, ContentScriptType } from 'api/types';

function escapeTitleText(text: string) {
	return text.replace(/(\[|\])/g, '\\$1');
}

joplin.plugins.register({
	onStart: async function () {
		//keyboard shortcut
		//top down append

		await joplin.settings.registerSection('myBacklinksCustomSection', {
			label: 'Backlinks',
			iconName: 'fas fa-hand-point-left',
		});
		await joplin.settings.registerSettings({'myBacklinksCustomSettingHeader': {
			value: "\\n\\n## Backlinks\\n",
			type: 2,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Heading above list of manual backlinks (use "\\n" as a new line)',
		}});

		await joplin.settings.registerSettings({'myBacklinksCustomSettingAutoMarkdown': {
			value: true,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Automatic backlinks section on every note',
    }});




		await joplin.settings.registerSettings({'myBacklinksCustomSettingTopOrBottom': {
			value: true,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Place "manual"  backlinks on the bottom (checked) or at the top (unchecked) ',
    }});

		await joplin.settings.registerSettings({'myBacklinksCustomHideBacklinksIfNoneAuto': {
			value: false,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: "Hide auto-backlinks section if there are no backlinks (works for preview only, not for panel)"
    }});
		await joplin.settings.registerSettings({'myBacklinksCustomSettingUseHint': {
			value: true,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: "Use text hint if there are no backlinks (manual insert)"
    }});
		
		await joplin.settings.registerSettings({'myBacklinksCustomSettingAutoHeader': {
			value: "Backlinks<br>",
			type: 2,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Heading above list of backlinks in automatic section and panel (can use html)',
		}});
		await joplin.settings.registerSettings({'myBacklinksCustomSettingPanelFontAnchors': {
			value: 13,
			type: 1,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Font size of links in panel (switch notes to see effect)',
		}});
		await joplin.settings.registerSettings({'myBacklinksCustomSettingUsePanel': {
			value: false,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: "Show backlinks in panel (might require restart)"
    }});


		await joplin.settings.registerSettings({'myBacklinksCustomSettingIgnoreList': {
			value: [],
			type: 4,
			section: 'myBacklinksCustomSection',
			public: false,
			label: "Ignore notes list"

    }});

		let usePanel = await joplin.settings.value('myBacklinksCustomSettingUsePanel')





		let panel

		if (usePanel) {
			panel = await joplin.views.panels.create("backlinksPanel");
			await joplin.views.panels.setHtml(panel, "<h3>Change notes back and forth if you see this</h3>");
			//await panels.addScript(view, './webview.js');
			await joplin.views.panels.addScript(panel, './panel.css');
			await joplin.views.panels.show(panel)
		}
		else {
			//await joplin.views.panels.hide(panel)
		}

		joplin.settings.onChange(async () => {

			let usePanel2 = await joplin.settings.value('myBacklinksCustomSettingUsePanel')
			console.log("panel via option");

			console.log(usePanel2)
			if (usePanel2) {

				await joplin.views.panels.show(panel)


			} else {

				await joplin.views.panels.hide(panel)

			}

		})

		await joplin.commands.register({
			name: "insertBackReferences",
			label: "Insert backlinks",
			iconName: "fas fa-hand-point-left",
			execute: async () => {

				let data = await joplin.workspace.selectedNote();
				let body = data.body;
				let notes
				let has_more = true
				let page = 1
				let references = await joplin.settings.value('myBacklinksCustomSettingHeader');
				let thereAreNotes = false
				let useManualHint = await joplin.settings.value('myBacklinksCustomSettingUseHint')
				let ignoreListArray = await joplin.settings.value('myBacklinksCustomSettingIgnoreList');
				while (has_more) {
					notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page: page });
					
					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];
						let ignore = element.body.includes("<!-- backlinks-ignore -->")
						//references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
						let inIgnoreList = ignoreListArray.includes(element.id)
						if (!(ignore || inIgnoreList)) {
							references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
							thereAreNotes = true
						}
					}
					if (notes.has_more) { page = page + 1 } else { has_more = false }

				}

				let newData
				let topOrBottom = await joplin.settings.value('myBacklinksCustomSettingTopOrBottom');
				if (!thereAreNotes && useManualHint) {
					references = references + "\n<small><font color='grey'><i>No backlinks</i></font></small>"
				}
				if (topOrBottom) {
					newData = body + references.replace(/\\n/g, "\n")
				} else {
					let bodyArr = body.split("\n")
					bodyArr.splice(1, 0, references.replace(/\\n/g, "\n"));
					newData = bodyArr.join("\n")
				}


				await joplin.commands.execute('textSelectAll')
				await joplin.commands.execute('replaceSelection', newData)

			}
		});
		const dialogs = joplin.views.dialogs;
		const backlinksIgnoreOnDialog = await dialogs.create('myBacklinksIgnoreOn');
		const backlinksIgnoreOffDialog = await dialogs.create('myBacklinksIgnoreOff');

		await joplin.commands.register({
			name: "backlinksIgnoreListAddCurrent",
			label: "Add current to ignore list",
			iconName: "fas fa-hand-point-left",
			execute: async () => {
				//note implemented

			}

		})
		await joplin.commands.register({
			name: "backlinksIgnoreListToggleCurrent",
			label: "Toggle current note in ignore list",
			iconName: "fas fa-hand-point-left",
			execute: async () => {
				let currentNote = await joplin.workspace.selectedNote()
				let toToggleId = currentNote.id



				let ignoreListArray = await joplin.settings.value('myBacklinksCustomSettingIgnoreList');
				if (ignoreListArray.includes(toToggleId)) {
					// remove from list
					let index = ignoreListArray.indexOf(toToggleId);
					if (index > -1) {
						ignoreListArray.splice(index, 1);
					}

					let html = "Note removed from <br>backlinks ignore list"
					alert(html.replace("<br>","\n"))
					/*
					let chacheBust = new Date().getTime()
					html = html + `<input type='hidden' value='${chacheBust}'`
					await dialogs.setHtml(backlinksIgnoreOffDialog, html)
					await dialogs.open(backlinksIgnoreOffDialog)
					*/
				} else {
					//add to list
					let html = "Note added to <br>backlinks ignore list"
					alert(html.replace("<br>","\n"))
					/*let chacheBust = new Date().getTime()
					html = html + `<input type='hidden' value='${chacheBust}'`
					await dialogs.setHtml(backlinksIgnoreOnDialog, html)
					await dialogs.open(backlinksIgnoreOnDialog)
					*/
					ignoreListArray.push(toToggleId)
				}
				await joplin.settings.setValue('myBacklinksCustomSettingIgnoreList', ignoreListArray);
			}

		})

		const backlinksIgnoreListDialog = await dialogs.create('myBacklinksIgnoreList');
		await joplin.commands.register({
			name: "backlinksIgnoreListOpen",
			label: "View Backlinks ignore list",
			iconName: "fas fa-hand-point-left",
			execute: async () => {

				let htmlStart = "<b>Notes in ignore list</b><form name='goto'><select style='width:100%' name='gotoid' size='6'>";
				let html = ""
				let htmlEnd = "</select></form>"
				let ignoreListArray = await joplin.settings.value('myBacklinksCustomSettingIgnoreList');
				console.log(ignoreListArray)
				for (let i = 0; i < ignoreListArray.length; i++) {
					let el = ignoreListArray[i]
					let note = await joplin.data.get(['notes', el], { fields: ['id', 'title', 'body'] });
					html = html + `<option value="${note.id}">${note.title}</option>`
				}
				if (html == "") { html = "No notes in backlinks ignore list" }
				let chacheBust = new Date().getTime()
				htmlEnd = htmlEnd + `<input type='hidden' value='${chacheBust}'`
				html = htmlStart + html + htmlEnd
				await dialogs.setHtml(backlinksIgnoreListDialog, html)
				await dialogs.setButtons(backlinksIgnoreListDialog, [
					{
						id: 'ok',
						title:'Go to selected item'
					},
					{
						id: 'cancel',
					}
				]);
				let goToNoteId = await dialogs.open(backlinksIgnoreListDialog)
				if(goToNoteId.id=="ok"){
				try{
					await joplin.commands.execute("openNote",goToNoteId.formData.goto.gotoid);
				}catch(err){
					console.error(err)
				}
			}






			}

		})
		// Menu for ignore list
		await joplin.views.menus.create('myBacklinksIgnoreMenu', 'Backlinks ignore', [
			{
				commandName: "backlinksIgnoreListOpen",
				accelerator: "Ctrl+Alt+L"
			},
			{
				commandName: "backlinksIgnoreListToggleCurrent",
				accelerator: "Ctrl+Alt+T"
			}
		]);
		await joplin.views.toolbarButtons.create('insertRefsToolbar', 'insertBackReferences', ToolbarButtonLocation.EditorToolbar);
		await joplin.views.menuItems.create('inserRefsMenu', 'insertBackReferences', MenuItemLocation.Note, { accelerator: "Ctrl+Alt+B" });
		let contentScriptId = "backlinks"

		await joplin.contentScripts.onMessage(contentScriptId, async (message: any) => {
			// automatic backlinks in preview

			console.info('PostMessagePlugin (CodeMirror ContentScript): Got message:', message);

			let topOrBottom = await joplin.settings.value('myBacklinksCustomSettingTopOrBottom');
			console.log("got called getFun()")
			//get content
			let isAuto = await joplin.settings.value('myBacklinksCustomSettingAutoMarkdown')
			if (message.type == "getContent" && isAuto) {
				console.log("getting content")
				let data = await joplin.workspace.selectedNote();
				console.log('activeNote')
				console.log(data)
				let body = data.body;
				let notes
				let has_more = true
				let page = 1
				let referenceHeader = await joplin.settings.value('myBacklinksCustomSettingAutoHeader');
				let hideIfNoBacklinks = await joplin.settings.value('myBacklinksCustomHideBacklinksIfNoneAuto');
				let notesHtml
				let references = ""
				let thereAreAutoBacklinks = false
				while (has_more) {
					notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page: page });
					console.log(notes)
					let ignoreListArray = await joplin.settings.value('myBacklinksCustomSettingIgnoreList');
					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];
						
						let ignore = element.body.includes("<!-- backlinks-ignore -->")

						//references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
						let inIgnoreList = ignoreListArray.includes(element.id)
						if (!(ignore || inIgnoreList)) {

							references = references + "" + `<a href="#" onclick="webviewApi.postMessage('${contentScriptId}', {type:'openNote',noteId:'${element.id}'})">${escapeTitleText(element.title)}</a><br>`;
							thereAreAutoBacklinks = true
						}


					}
					if (notes.has_more) { page = page + 1 } else { has_more = false }
				}

				if (!thereAreAutoBacklinks) {
					references = references + "\n<small><font color='grey'><i>No backlinks</i></font></small>"
				}
				let newData = references
				let topOrBottom = await joplin.settings.value('myBacklinksCustomSettingTopOrBottom');
				if (topOrBottom) {
					//newData = references.replace(/\\n/g, "<br>")
				} else {
					//let bodyArr = body.split("<br>")

					//inserting references here
					//bodyArr.splice(1, 0, references.replace(/\\n/g, "<br>"));

					//newData = bodyArr.join("<br>")
				}


				let response = ''
				if (hideIfNoBacklinks && !thereAreAutoBacklinks) {
					// no backlinks to show

				} else {
					response = `${referenceHeader.replace(/\\n/g, "<br>")}${newData}`
				}







				return response;


			} else if (message.type == "openNote") {
				await joplin.commands.execute('openNote', message.noteId);
				console.log("open note")
			}
			else {

				//console.log("some error occured");
				console.log(message);
				return ''
			}




		});

		//panel
		joplin.workspace.onNoteSelectionChange(async () => {
			usePanel = await joplin.settings.value('myBacklinksCustomSettingUsePanel')
			if (usePanel) {

				let panelHtml;
				console.log("getting content for panel")
				let data = await joplin.workspace.selectedNote();
				console.log('activeNote')
				console.log(data)
				let body = data.body;
				let notes
				let has_more = true
				let page = 1
				let panelHeader = await joplin.settings.value('myBacklinksCustomSettingAutoHeader');
				let panelLinksFontSize =await joplin.settings.value('myBacklinksCustomSettingPanelFontAnchors');
				let references = ""
				let thereAreAutoBacklinks = false
				while (has_more) {
					notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page: page });
					console.log(notes)

					let ignoreListArray = await joplin.settings.value('myBacklinksCustomSettingIgnoreList');




					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];

						let ignore = element.body.includes("<!-- backlinks-ignore -->")
						let inIgnoreList = ignoreListArray.includes(element.id)
						//references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
						if (!(ignore || inIgnoreList)) {

							references = references + "" + `<a href="#" onclick="webviewApi.postMessage({type:'openNote',noteId:'${element.id}'})">${escapeTitleText(element.title)}</a><br>`;
							thereAreAutoBacklinks = true
						}


					}
					if (notes.has_more) { page = page + 1 } else { has_more = false }
				}

				if (!thereAreAutoBacklinks) {
					references = references + "\n<small><font color='grey'><i>No backlinks</i></font></small>"
				}
				let newData = references

				let response = ''


				response = `${panelHeader.replace(/\\n/g, "<br>")}${newData}`
				

				panelHtml = response
				panelHtml = `<style>a { font-size:${panelLinksFontSize}px; }</style>${panelHtml}`

				await joplin.views.panels.setHtml(panel, panelHtml)
			}


		})

		if (panel) {
			await joplin.views.panels.onMessage(panel, async (message) => {

				await joplin.commands.execute("openNote", message.noteId)
			})
		}


		console.info('Test plugin started!');


		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			contentScriptId,
			'./notesReferences.js'
		);




		/*
				await joplin.contentScripts.register(
					ContentScriptType.MarkdownItPlugin,
					contentScriptId,
					'./notesReferences.js'
				);
		*/
		/*
		await joplin.plugins.registerContentScript(
			ContentScriptType.MarkdownItPlugin,
			'notesReferencesMeeeee',
			'./notesReferences.js'
		);
		*/
	},
});
