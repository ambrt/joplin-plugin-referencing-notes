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
		await joplin.settings.registerSetting('myBacklinksCustomSettingHeader', {
			value: "\\n\\n## Backlinks\\n",
			type: 2,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Heading above list of manual backlinks (use "\\n" as a new line)',
		});

		await joplin.settings.registerSetting('myBacklinksCustomSettingAutoMarkdown', {
			value: true,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Automatic backlinks section on every note',
		});




		await joplin.settings.registerSetting('myBacklinksCustomSettingTopOrBottom', {
			value: true,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Place "manual"  backlinks on the bottom (checked) or at the top (unchecked) ',
		});

		await joplin.settings.registerSetting('myBacklinksCustomHideBacklinksIfNoneAuto', {
			value: false,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: "Hide auto-backlinks section if there are no backlinks"
		});
		await joplin.settings.registerSetting('myBacklinksCustomSettingUseHint', {
			value: true,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: "Use text hint if there are no backlinks (manual insert)"
		});
		await joplin.settings.registerSetting('myBacklinksCustomSettingUsePanel', {
			value: false,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: "Show backlinks in panel (might require restart)"
		});
		await joplin.settings.registerSetting('myBacklinksCustomSettingAutoHeader', {
			value: "Backlinks<br>",
			type: 2,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Heading above list of backlinks in automatic section and panel (can use html)',
		})

		let usePanel = await joplin.settings.value('myBacklinksCustomSettingUsePanel')
		




		let panel = await joplin.views.panels.create("backlinksPanel");
		await joplin.views.panels.setHtml(panel, "<h3>Change notes back and forth if you see this</h3>");
		
		if (usePanel) {

			await joplin.views.panels.show(panel)
		}
		else{
			await joplin.views.panels.hide(panel)
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
				while (has_more) {
					notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page: page });

					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];
						let ignore = element.body.includes("<!-- backlinks-ignore -->")
						//references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
						if (!ignore) {
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

					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];

						let ignore = element.body.includes("<!-- backlinks-ignore -->")

						//references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
						if (!ignore) {

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
		joplin.workspace.onNoteSelectionChange(async ()=>{
			usePanel = await joplin.settings.value('myBacklinksCustomSettingUsePanel')
			if(usePanel){

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
				let references = ""
				let thereAreAutoBacklinks = false
				while (has_more) {
					notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page: page });
					console.log(notes)

					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];

						let ignore = element.body.includes("<!-- backlinks-ignore -->")

						//references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
						if (!ignore) {

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
				
				
					response = `<h3>${panelHeader.replace(/\\n/g, "<br>")}</h3>${newData}`
				

<<<<<<< Updated upstream
				panelHtml=response
=======

				response = `${panelHeader.replace(/\\n/g, "<br>")}<br>${newData}`


				panelHtml = response
>>>>>>> Stashed changes


				await joplin.views.panels.setHtml(panel, panelHtml)
			}


		})
<<<<<<< Updated upstream
<<<<<<< Updated upstream

	 await joplin.views.panels.onMessage(panel, async (message)=>{
=======
=======
>>>>>>> Stashed changes
		if(panel){
		await joplin.views.panels.onMessage(panel, async (message) => {
>>>>>>> Stashed changes
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
