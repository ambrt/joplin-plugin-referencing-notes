import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation, ContentScriptType } from 'api/types';

joplin.plugins.register({
	onStart: async function () {
		await joplin.commands.register({
			name: "insertBackReferences",
			label: "Insert references",
			iconName:"fas fa-hand-point-left",
			execute: async () => {

				let data = await joplin.workspace.selectedNote();
				let body = data.body
				await joplin.data.get(['search'], { query: data.id, fields: ['id', 'title', 'body'] }).then(res => { data = res });
				let references = "\n\n## References\n";
				for (let i = 0; i < data.items.length; i++) {
					let element = data.items[i];
					references = references + "\n" + `[${element.title}](:/${element.id})`;
				}
				let newData = body+references
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
