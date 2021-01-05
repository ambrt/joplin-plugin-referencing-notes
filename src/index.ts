import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation, ContentScriptType } from 'api/types';

function escapeTitleText(text: string) {
	return text.replace(/(\[|\])/g, '\\$1');
}

joplin.plugins.register({
	onStart: async function () {
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


				
				let newData = body+references.replace(/\\n/g,"\n")
				await joplin.commands.execute('textSelectAll')
				await joplin.commands.execute('replaceSelection', newData)

			}
		});
		await joplin.views.toolbarButtons.create('Insert references', 'insertBackReferences', ToolbarButtonLocation.EditorToolbar);
		await joplin.commands.register({
			name: 'getFun',
			label: 'Go to tag from render view2',
			execute: async () => {
				console.log("got called getFun()")
				return "fun fun fun"
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
