'use-strict';

require('dotenv').config();
const inquirer = require('inquirer').default;
const puppeteer = require('puppeteer');
const ollama = require('ollama').default;

const discordLogin = "https://discord.com/login";

const discordQuerySelectors = {
    email: 'input[name="email"]',
    password: 'input[name="password"]',
    connexion: 'Connexion',
    verify_other: 'Vérifier avec autre chose',
    a2f: 'Utilise ton application d\'authentification',
    input_a2f: 'input[autocomplete="one-time-code"]',
    a2f_confirm: 'Confirmer',
    search_anoying_people: 'input[placeholder="Rechercher"]',
    tous_div: 'Tous',
    list_people: 'div[data-list-id="people-list"] div>div[role="listitem"]>div',
    input_text: 'div[role=\"textbox\"]',

    last_message: 'ol[data-list-id="chat-messages"] li',
}

const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function askAnoyingPeople() {
    const questions = [
        { type: 'input', name: 'anoying_people', message: 'Entrez le nom de la personne qui vous emmerde :' }
    ];

    return inquirer.prompt(questions);
}

async function askA2f() {
    const questions = [
        { type: 'input', name: 'a2f', message: 'Entrez votre code a2f :' }
    ];

    return inquirer.prompt(questions);
}

async function askCredentials() {
    const questions = [];

    if (process.env.DISCORD_EMAIL === undefined) questions.push({ type: 'input', name: 'email', message: 'Entrez votre email :' });
    if (process.env.DISCORD_PASSWORD === undefined) questions.push({ type: 'password', name: 'password', message: 'Entrez votre mot de passe :', mask: '*' });

    let answer = await inquirer.prompt(questions);

    if (process.env.DISCORD_EMAIL !== undefined) answer.email = process.env.DISCORD_EMAIL;
    if (process.env.DISCORD_PASSWORD !== undefined) answer.password = process.env.DISCORD_PASSWORD;

    return { email: answer.email, password: answer.password };
}

async function findTabDiv(page, query) {
    return await page.evaluateHandle((query) => {
        const divs = document.querySelectorAll('div[role="tab"]');
        for (const div of divs) {
            if (div && div.innerText.includes(query)) {
                return div;
            }
        }
        
        return null;
    }, query);
}

async function findDivChild(page, query) {
    return await page.evaluateHandle((query) => {
        const divs = document.querySelectorAll('div');
        for (const div of divs) {
            const childDiv = div.querySelector('div');
            if (childDiv && childDiv.innerText.includes(query)) {
                return div;
            }
        }
        return null;
    }, query);
}

async function findButton(page, query) {
    return await page.evaluateHandle((query) => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const div = button.querySelector('div');
            if (div && div.innerText.includes(query)) {
                return button;
            }
        }
        return null;
    }, query);
}

async function getListPeopleHierarchy(page, divSelector) {
    return await page.evaluateHandle((selector) => {
        const element = document.querySelector(selector);
        return element;
    }, divSelector);
}

async function discord_puppeteer() {
    const browser = await puppeteer.launch({ headless: false, slowMo: 0 });
    const page = await browser.newPage();
    await page.goto(discordLogin, { waitUntil: 'domcontentloaded' });
    await page.setViewport({ width: 800, height: 800 })

    const { email, password } = await askCredentials();

    await page.waitForSelector(discordQuerySelectors.email);
    const input_email = await page.$(discordQuerySelectors.email);
    await input_email.type(email);

    await page.waitForSelector(discordQuerySelectors.password);
    const input_password = await page.$(discordQuerySelectors.password);
    await input_password.type(password);

    const button_connexion = await findButton(page, discordQuerySelectors.connexion);
    await button_connexion.click();

    await waitFor(3000);

    const button_verify_other = await findButton(page, discordQuerySelectors.verify_other);
    await button_verify_other.click();

    await waitFor(1000);

    const button_a2f = await findDivChild(page, discordQuerySelectors.a2f);
    await button_a2f.click(button_a2f);

    await waitFor(1000);

    const { a2f } = await askA2f();

    await page.waitForSelector(discordQuerySelectors.input_a2f);
    const input_a2f = await page.$(discordQuerySelectors.input_a2f);
    await input_a2f.type(a2f);

    const button_a2f_confirm = await findButton(page, discordQuerySelectors.a2f_confirm);
    await button_a2f_confirm.click();

    const { anoying_people } = await askAnoyingPeople()

    await page.waitForSelector(discordQuerySelectors.list_people);

    const tous_div = await findTabDiv(page, discordQuerySelectors.tous_div);
    await tous_div.click();

    await page.waitForSelector(discordQuerySelectors.search_anoying_people);
    const input_search = await page.$(discordQuerySelectors.search_anoying_people);
    await input_search.type(anoying_people);

    await waitFor(1000);

    const anoying_guy = await getListPeopleHierarchy(page, discordQuerySelectors.list_people);
    await anoying_guy.click();

    await waitFor(1000);

    let message_infos = await getMessageInfos(page, discordQuerySelectors.last_message);

    while (true) {
        const new_message_infos = await getMessageInfos(page, discordQuerySelectors.last_message);
        await waitFor(1000);
        if (message_infos.id == new_message_infos.id) continue;
        message_infos = new_message_infos;
        
        await page.keyboard.type(await handleOllama(message_infos.text));
        await page.keyboard.press('Enter');
    }
}

async function getMessageInfos(page, lastMessageSelector) {
    return await page.evaluate((lastMessage) => {
        const user = document.querySelector('section[aria-label="Zone utilisateur"]>div>div>div>div>div').innerText

        const list_message = document.querySelectorAll(lastMessage);
        const anoying_list_message = [];

        let last_message_user_span = null;

        for (const message of list_message) {
            const new_message_user_span = message.querySelector('div>div>h3>span>span');
            if (!new_message_user_span) {
                if (!last_message_user_span) continue;
                new_message_user_span = last_message_user_span;
            }
            const message_user = new_message_user_span.innerText;
            if (message_user == user) continue;
            anoying_list_message.push(message);
        }

        const last_message = anoying_list_message[anoying_list_message.length-1];
        const span_text = last_message.querySelectorAll('div>div>div>span');
        let text = "";
        for (span of span_text) {
            if (span.querySelector('time')) continue;
            text += span.innerText;
        }

        return {
            id: last_message.id,
            text: text,
        }
    }, lastMessageSelector);
}

async function handleOllama(question) {
    const message = { role: 'user', content: question }
    const response = await ollama.chat({ model: MODEL, messages: [message], stream: true })
    let text = "";
    for await (const part of response) {
        text += part.message.content;
    }
    return text;
}

async function configOllama(config) {
    const message = { role: 'user', content: config }
    await ollama.chat({ model: MODEL, messages: [message], stream: false })
}

async function main() {
    // await discord_puppeteer();

    const config =
        "";

    await configOllama(config);

    discord_puppeteer();
}

const MODEL = 'wizard-vicuna-uncensored';

main()
