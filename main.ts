import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, ViewStateResult } from 'obsidian';

// IPA view type
const IPA_VIEW_TYPE = "ipa-palette-view";

interface MyPluginSettings {
	// Show/hide settings for each category
	showVowels: boolean;
	showConsonants: boolean;
	showDiacritics: boolean;
	showSuprasegmentals: boolean;
	
	// Order of categories (array of category names)
	categoryOrder: string[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	showVowels: true,
	showConsonants: true,
	showDiacritics: true,
	showSuprasegmentals: true,
	categoryOrder: ['Vowels', 'Consonants', 'Diacritics', 'Suprasegmentals']
}

// IPA Palette View
class IPAPaletteView extends ItemView {
	plugin: MyPlugin;
	private lastActiveEditor: Editor | null = null;
	private lastActiveView: MarkdownView | null = null;
	
	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
		
		// Set up an event listener to track the active editor (because the active editor is not always the one in the right sidebar)
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					this.lastActiveView = activeView;
					this.lastActiveEditor = activeView.editor;
				}
			})
		);
	}

	getViewType(): string {
		return IPA_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "IPA Palette";
	}
	
	getIcon(): string {
		return "whole-word";
	}

	// IPA character sets
	private ipaVowels = [
		'i', 'y', 'ɨ', 'ʉ', 'ɯ', 'u', 
		'ɪ', 'ʏ', 'ʊ', 
		'e', 'ø', 'ɘ', 'ɵ', 'ɤ', 'o', 
		'ə', 
		'ɛ', 'œ', 'ɜ', 'ɞ', 'ʌ', 'ɔ', 
		'æ', 'ɐ', 
		'a', 'ɶ', 'ɑ', 'ɒ'
	];

	private ipaConsonants = [
		'p', 'b', 't', 'd', 'ʈ', 'ɖ', 'c', 'ɟ', 'k', 'g', 'q', 'ɢ', 'ʔ',
		'm', 'ɱ', 'n', 'ɳ', 'ɲ', 'ŋ', 'ɴ',
		'ʙ', 'r', 'ʀ', 
		'ɾ', 'ɽ',
		'ɸ', 'β', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'ʂ', 'ʐ', 'ç', 'ʝ', 'x', 'ɣ', 'χ', 'ʁ', 'ħ', 'ʕ', 'h', 'ɦ',
		'ɬ', 'ɮ', 'ʋ', 'ɹ', 'ɻ', 'j', 'ɰ', 'l', 'ɭ', 'ʎ', 'ʟ'
	];

	private diacritics = [
		'̥', '̬', '̹', '̜', '̟', '̠', '̈', '̽', '̩', '̯', '˞', '̤', '̰', '̼', '̪', '̺', '̻', '̃', 'ⁿ', 'ˡ', '̚', '̘', '̙', '̝', '̞', '̆', '̋', '́', '̄', '̀', '̏', '̌', '̂', '᷄', '᷅', '᷈', '↓', '↑', '↗', '↘'
	];

	private suprasegmentals = [
		'ˈ', 'ˌ', 'ː', 'ˑ', '̆', '|', '‖', '.', '‿', '͡'
	];

		
	
	async onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		
		contentEl.createEl('h2', {text: 'IPA Palette'});
		
		// Get the category order from settings
		const categoryOrder = this.plugin.settings.categoryOrder;
		
		// Create sections based on settings and order
		for (const category of categoryOrder) {
			switch (category) {
				case 'Vowels':
					if (this.plugin.settings.showVowels) {
						this.createCharacterSection(contentEl, 'Vowels', this.ipaVowels);
					}
					break;
				case 'Consonants':
					if (this.plugin.settings.showConsonants) {
						this.createCharacterSection(contentEl, 'Consonants', this.ipaConsonants);
					}
					break;
				case 'Diacritics':
					if (this.plugin.settings.showDiacritics) {
						this.createCharacterSection(contentEl, 'Diacritics', this.diacritics);
					}
					break;
				case 'Suprasegmentals':
					if (this.plugin.settings.showSuprasegmentals) {
						this.createCharacterSection(contentEl, 'Suprasegmentals', this.suprasegmentals);
					}
					break;
			}
		}
	}

	private createCharacterSection(container: HTMLElement, title: string, characters: string[]) {
		const sectionEl = container.createDiv({cls: 'ipa-section'});
		sectionEl.createEl('h3', {text: title});
		
		const gridEl = sectionEl.createDiv({cls: 'ipa-grid'});
		
		for (const char of characters) {
			const charButton = gridEl.createEl('button', {
				text: char,
				cls: 'ipa-char-button'
			});
			
			charButton.addEventListener('click', () => {
				this.insertCharacterAtCursor(char);
			});
		}
	}

	private insertCharacterAtCursor(char: string) {
		// Use the stored editor reference instead of getting the currently active one
		if (this.lastActiveEditor && this.lastActiveView) {
			const editor = this.lastActiveEditor;
			const cursor = editor.getCursor();
			editor.replaceRange(char, cursor);
			
			// Move cursor after the inserted character
			editor.setCursor({
				line: cursor.line,
				ch: cursor.ch + char.length
			});
			
			// Give focus back to the editor
			this.lastActiveView.editor.focus();
		} else {
			new Notice('No active markdown editor found. Please click in an editor first.');
		}
	}

	async onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private ipaView: IPAPaletteView;

	async onload() {
		await this.loadSettings();

		// Register the custom view type
		this.registerView(
			IPA_VIEW_TYPE,
			(leaf) => {
				this.ipaView = new IPAPaletteView(leaf, this);
				return this.ipaView;
			}
		);

		// Automatically open the IPA palette when the plugin loads
		this.app.workspace.onLayoutReady(() => {
			this.activateView();
		});

		// Add a command to open the IPA palette
		this.addCommand({
			id: 'open-ipa-palette',
			name: 'Open IPA Palette',
			callback: () => {
				this.activateView();
			}
		});

		this.addSettingTab(new IPASettingTab(this.app, this));
	}

	// Function to activate the IPA palette view
	async activateView() {
		const { workspace } = this.app;
		
		// Check if the view is already open
		const existingLeaves = workspace.getLeavesOfType(IPA_VIEW_TYPE);
		
		if (existingLeaves.length > 0) {
			// If the view exists, reveal it
			workspace.revealLeaf(existingLeaves[0]);
			return;
		}
		
		// If the view doesn't exist, create it in the right sidebar
		await workspace.getRightLeaf(false).setViewState({
			type: IPA_VIEW_TYPE,
			active: true,
		});
	}

	onunload() {
		// Unregister the view when the plugin is disabled
		this.app.workspace.detachLeavesOfType(IPA_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// refreshes view when settings change
	refreshView() {
		if (this.ipaView) {
			this.ipaView.onOpen();
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class IPASettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'IPA Palette Settings'});

		// Category visibility settings
		containerEl.createEl('h3', {text: 'Category Visibility'});
		
		new Setting(containerEl)
			.setName('Show Vowels')
			.setDesc('Show the vowels section in the IPA palette')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showVowels)
				.onChange(async (value) => {
					this.plugin.settings.showVowels = value;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));

		new Setting(containerEl)
			.setName('Show Consonants')
			.setDesc('Show the consonants section in the IPA palette')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showConsonants)
				.onChange(async (value) => {
					this.plugin.settings.showConsonants = value;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));

		new Setting(containerEl)
			.setName('Show Diacritics')
			.setDesc('Show the diacritics section in the IPA palette')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showDiacritics)
				.onChange(async (value) => {
					this.plugin.settings.showDiacritics = value;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));

		new Setting(containerEl)
			.setName('Show Suprasegmentals')
			.setDesc('Show the suprasegmentals section in the IPA palette')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showSuprasegmentals)
				.onChange(async (value) => {
					this.plugin.settings.showSuprasegmentals = value;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));

		// Category order settings
		containerEl.createEl('h3', {text: 'Category Order'});
		containerEl.createEl('p', {text: 'Drag to reorder the categories'});

		const orderList = containerEl.createEl('div', {cls: 'ipa-order-list'});
		
		// draggable list of categories
		for (let i = 0; i < this.plugin.settings.categoryOrder.length; i++) {
			const category = this.plugin.settings.categoryOrder[i];
			const item = orderList.createEl('div', {
				cls: 'ipa-order-item',
				text: category
			});
			
			// drag handle
			const dragHandle = item.createEl('span', {
				cls: 'ipa-drag-handle',
				text: '≡'
			});
			
			
			item.setAttribute('draggable', 'true');
			
			
			item.addEventListener('dragstart', (e) => {
				e.dataTransfer.setData('text/plain', i.toString());
				item.addClass('ipa-dragging');
			});
			
			item.addEventListener('dragend', () => {
				item.removeClass('ipa-dragging');
			});
			
			item.addEventListener('dragover', (e) => {
				e.preventDefault();
				item.addClass('ipa-drag-over');
			});
			
			item.addEventListener('dragleave', () => {
				item.removeClass('ipa-drag-over');
			});
			
			item.addEventListener('drop', async (e) => {
				e.preventDefault();
				item.removeClass('ipa-drag-over');
				
				const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
				const toIndex = i;
				
				if (fromIndex !== toIndex) {
					// Reorder the array
					const newOrder = [...this.plugin.settings.categoryOrder];
					const [moved] = newOrder.splice(fromIndex, 1);
					newOrder.splice(toIndex, 0, moved);
					
					this.plugin.settings.categoryOrder = newOrder;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
					
					// Refresh the settings display
					this.display();
				}
			});
		}
	}
}
