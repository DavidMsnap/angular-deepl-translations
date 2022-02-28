<script lang="ts">
	import 'carbon-components-svelte/css/white.css';
	import { Dropdown, Button, CodeSnippet } from 'carbon-components-svelte';

	// @ts-ignore
	import type monaco from 'monaco-editor';

	import { onMount } from 'svelte';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
	import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
	import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

	import { Language, languageFlags } from '../types/languages';
	import type { TranslateRequestBody } from 'src/types/requestBody';

	let inputLang: string = Language.German;

	let inputContainer: HTMLDivElement = null;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let Monaco;

	let translations: { [langString: string]: string } = {};
	let translating = false;

	onMount(async () => {
		// @ts-ignore
		self.MonacoEnvironment = {
			getWorker: function (_moduleId: any, label: string) {
				if (label === 'json') {
					return new jsonWorker();
				}
				if (label === 'css' || label === 'scss' || label === 'less') {
					return new cssWorker();
				}
				if (label === 'html' || label === 'handlebars' || label === 'razor') {
					return new htmlWorker();
				}
				if (label === 'typescript' || label === 'javascript') {
					return new tsWorker();
				}
				return new editorWorker();
			}
		};

		const monacoOptions = {
			minimap: {
				enabled: false
			},
			selectOnLineNumbers: true,
			wordWrap: 'on'
		};

		// @ts-ignore
		Monaco = await import('monaco-editor');
		editor = Monaco.editor.create(inputContainer, {
			value: '{\n\n}',
			language: 'json',
			options: monacoOptions
		});

		return () => {
			editor.dispose();
		};
	});

	const getSourceDropdownOptions = () => {
		return Object.keys(Language).map((langKey) => {
			return {
				id: Language[langKey],
				text: langKey
			};
		});
	};

	const translate = async () => {
		const inputText: string = editor.getValue();
		// editor.setValue(JSON.stringify(inputText, undefined, 4));

		// for now limit of input json 1500chars (inlcuding keys we don't send to deepl)
		// because deepL api max limit of 500k per month
		if (inputText.length > 1500) {
			alert('Input is too long (over 1.5k characters).');
			return;
		}

		let inputJson;
		try {
			inputJson = JSON.parse(inputText);
		} catch (e) {
			// TOODO nice modal not alert?
			alert('Invalid JSON');
			return;
		}

		// translate to all except input lang
		const translationDestinations = Object.values(Language).filter((lang) => lang !== inputLang);

		// prettify ouptut of same lang
		translations[inputLang] = JSON.stringify(inputJson, undefined, 4);

		try {
			const body: TranslateRequestBody = {
				inputText: inputJson,
				inputLang: inputLang,
				outputLangs: translationDestinations
			};

			translating = true;

			const result = await fetch(`/translate`, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const resultJson = await result.json();
			translating = false;
			console.log('Translation results: ', resultJson);

			for (const lang in resultJson) {
				translations[lang] = JSON.stringify(resultJson[lang], undefined, 4);
			}
		} catch (e) {
			// TODO nice modal not alert?
			alert(e);
		}
	};

	const copyMarkdown = () => {
		let message = '';
		for (const key of Object.keys(translations)) {
			message += `${languageFlags[key]} ${key.toUpperCase()}:\n\n\`\`\`\n${translations[key]}\n\`\`\`\n\n`;
		}
		navigator.clipboard.writeText(message)
	}
</script>

<div class="content">
	<h1>
		<img class="embedded-icon" src="/angular.svg" alt="Angular" /> translations via
		<img class="embedded-icon" src="/deepl.svg" alt="DeepL" />
	</h1>

	<div class="columns">
		<div class="column">
			<Dropdown
				titleText="Source language"
				selectedIndex={0}
				items={getSourceDropdownOptions()}
				on:select={(selectedItem) => {
					inputLang = selectedItem.detail.selectedId;
					console.log(inputLang);
				}}
			/>
			<div class="monaco-border">
				<div class="monaco-container" bind:this={inputContainer} />
			</div>

			<div class="button-row">
				<Button on:click={translate}>Translate</Button>

				{#if Object.keys(translations).length > 1}
					<Button kind="secondary" on:click={copyMarkdown}>Copy all as Markdown</Button>
				{/if}
			</div>
		</div>

		<div class="column">
			{#each Object.keys(Language).filter((languageKey) => Language[languageKey] != inputLang) as langKey}
				<span class="lang-label">{langKey} {languageFlags[Language[langKey]]}</span>
				<div class="lang-result">
					<CodeSnippet
						type="multi"
						wrapText={true}
						code={translations?.[Language[langKey]] || ''}
						skeleton={translating}
					/>
				</div>
			{/each}
		</div>
	</div>
</div>

<div id="attributionContainer">
	<span class="attributionLine">Made With ❤️</span>
	<span class="attributionLine"
		>by <a href="https://github.com/DavidM42/angular-deepl-translations" target="_blank">David</a
		></span
	>
</div>

<style lang="scss">
	// general styles
	div.content {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		h1 {
			margin-top: 50px;
			margin-bottom: 25px;

			& > img.embedded-icon {
				// icons embedded in h1 headline
				height: 3rem;
				padding-top: 1.2rem;
			}
		}

		& .columns {
			display: flex;

			& > .column {
				margin: 20px;

				& > .monaco-border {
					margin-bottom: 10px;
					margin-top: 10px;
					border: 1px solid #333;
					padding: 10px;

					& > .monaco-container {
						text-align: left;
						min-height: 300px;
						max-width: 100%;
					}
				}

				& .button-row {
					display: flex;
					justify-content: space-between;
				}

				& > .lang-label {
					font-size: 1.3em;
					font-weight: 510;
				}

				& > .lang-result {
					margin-top: 10px;
					margin-bottom: 10px;
				}
			}
		}
	}

	@media only screen and (min-width: 1150px) {
		// dsktop two column ui
		h1 {
			font-size: 3rem;
		}

		div.columns {
			flex-direction: row;
			& > .column {
				max-width: 45vw;
				width: 600px;
			}
		}
	}

	@media only screen and (max-width: 1149px) {
		// mobile phone one column ui
		h1 {
			font-size: 2rem;
		}

		div.columns {
			flex-direction: column;
			flex-wrap: wrap;
			& > .column {
				width: 95vw;
			}
		}
	}

	// overwrite for weird styling of pre in multiline code-snippet
	:global(pre) {
		padding-bottom: 0px !important;
	}

	#attributionContainer {
		position: fixed;
		bottom: 5px;
		right: 10px;

		text-align: right;
		color: #9b9b9b;
		font-size: 0.75em;

		z-index: 1000;
		background-color: #fff;
		padding: 5px;
		border: 1px solid #333;
		border-radius: 5px;
	}

	span.attributionLine {
		display: block;

		& a {
			color: #0353e9;
		}
	}
</style>
