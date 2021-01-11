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
		await joplin.settings.registerSetting('myBacklinksCustomSetting', {
			value: "\\n\\n## References\\n",
			type: 2,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Heading above list of backlinks (use "\\n" as a new line)',
		});
		await joplin.settings.registerSetting('myBacklinksCustomSettingTopOrBottom', {
			value: true,
			type: 3,
			section: 'myBacklinksCustomSection',
			public: true,
			label: 'Place backlinks on the bottom (checked) or at the top (unchecked) ',
		});
		
		await joplin.commands.register({
			name: "insertBackReferences",
			label: "Insert references",
			iconName:"fas fa-hand-point-left",
			execute: async () => {

				let data = await joplin.workspace.selectedNote();
				let body = data.body;
				let notes
				let has_more =true
				let page = 1
				let references = await joplin.settings.value('myBacklinksCustomSetting');
				while (has_more) {
					notes = await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'], page:page });
				
					for (let i = 0; i < notes.items.length; i++) {
						let element = notes.items[i];
						references = references + "\n" + `[${escapeTitleText(element.title)}](:/${element.id})`;
					}	
					if (notes.has_more) { page = page + 1 } else { has_more = false }
	
				}

				let newData
				let topOrBottom = await joplin.settings.value('myBacklinksCustomSettingTopOrBottom');
				if(topOrBottom){
					newData = body+references.replace(/\\n/g,"\n")
				}else{
					let bodyArr=body.split("\n")
					bodyArr.splice(1, 0, references.replace(/\\n/g,"\n"));
					newData = bodyArr.join("\n")
				}
				
				
				await joplin.commands.execute('textSelectAll')
				await joplin.commands.execute('replaceSelection', newData)

			}
		});
		await joplin.views.toolbarButtons.create('insertRefsToolbar', 'insertBackReferences', ToolbarButtonLocation.EditorToolbar);
		await joplin.views.menuItems.create('inserRefsMenu', 'insertBackReferences', MenuItemLocation.Note, {accelerator:"Ctrl+Alt+B"});
		await joplin.commands.register({
			name: 'getCont',
			label: 'returns backlinks html',
			execute: async () => {
				console.log("got called getFun()")
				return "<b> testing html from command</b>"
			},
		});
		console.info('Test plugin started!');
		/*
		await joplin.plugins.registerContentScript(
			ContentScriptType.MarkdownItPlugin,
			'notesReferencesMeeeee',
			'./notesReferences.js'
		);
		*/
	},
});
