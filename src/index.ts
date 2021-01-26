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
			label: 'Heading above list of backlinks (use "\\n" as a new line)',
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

		await joplin.commands.register({
			name: "insertBackReferences",
			label: "Insert references",
			iconName: "fas fa-hand-point-left",
			execute: async () => {

				let data = await joplin.workspace.selectedNote();
				let body = data.body;
				let notes
				let has_more = true
				let page = 1
				let references = await joplin.settings.value('myBacklinksCustomSettingHeader');
				while (has_more) {
					notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page: page });

					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];
						references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
					}
					if (notes.has_more) { page = page + 1 } else { has_more = false }

				}

				let newData
				let topOrBottom = await joplin.settings.value('myBacklinksCustomSettingTopOrBottom');
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

		await joplin.contentScripts.onMessage(contentScriptId, async (message:any) => {
			console.info('PostMessagePlugin (CodeMirror ContentScript): Got message:', message);
			//const response = message + '+responseFromCodeMirrorScriptHandler';
			//console.info('PostMessagePlugin (CodeMirror ContentScript): Responding with:', response);
			//return response;
			let topOrBottom = await joplin.settings.value('myBacklinksCustomSettingTopOrBottom');
				console.log("got called getFun()")
				//return "<b> testing html from command</b>"
				//get content
				let isAuto=await joplin.settings.value('myBacklinksCustomSettingAutoMarkdown')
				if (message.type == "getContent" && isAuto) {
					console.log("getting content")
					let data = await joplin.workspace.selectedNote();
					let body = data.body;
					let notes
					let has_more = true
					let page = 1
					let referenceHeader = await joplin.settings.value('myBacklinksCustomSettingHeader');
					let notesHtml
					let references =""
					while (has_more) {
						notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page: page });
						console.log(notes)
						
						for (let i = 0; i < notes.items.length; i++) {
							let element = notes.items[i];
							//references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
							references = references + "" + `<a href="#" onclick="webviewApi.postMessage('${contentScriptId}', {type:'openNote',noteId:'${element.id}'})">${escapeTitleText(element.title)}</a><br>`;
							

						}
						if (notes.has_more) { page = page + 1 } else { has_more = false }
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


					let response = `<h3>${referenceHeader.replace(/\\n/g,"<br>")}</h3>${newData}`
					return response;


				} else if (message.type =="openNote") {
					await joplin.commands.execute('openNote', message.noteId);
					console.log("open note")
				}
				else {

					console.log("some error occured");
					console.log(message);
					console.info("some error occured");
					console.info(message);
					return ''
				}


			

			});


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
