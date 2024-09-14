'use-strict';

require('dotenv').config();
const inquirer = require('inquirer').default;
const puppeteer = require('puppeteer');
const ollama = require('ollama').default;

const discordLogin = "https://discord.com/login";

const discordQuerySelectors = {
    email: 'input[name="email"]',
    captcha: 'div[role="dialog"]',
    invalid: 'label[class="label_c46f6a eyebrow_c46f6a defaultColor_c46f6a defaultMarginlabel_c46f6a error_c46f6a"]',
    password: 'input[name="password"]',
    connexion: 'button[type="submit"]',
    verify_other: 'div[style="flex: 0 0 auto;"]>button:first-child',
    a2f: 'div[role="button"]:nth-last-child(4)',
    a2fInvalid: 'div[style="color: var(--text-danger);"]',
    input_a2f: 'input[autocomplete="one-time-code"]',
    a2f_confirm: 'button[type="submit"]',
    search_anoying_people: 'div[role="tabpanel"]>div>div>input',
    tous_div: 'div[role="tab"]:nth-of-type(2)',
    list_people: 'div[role="list"] div>div[role="listitem"]>div',
    list_anoying_guys: 'div[role="list"] div>div[role="listitem"]>div>div>div:nth-of-type(2)>div>span',

    last_message: 'ol[role="list"] li',
}

const config_model =
        ""+
        "";

let anoying_people = '';
let user = '';

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

    if (process.env.DISCORD_EMAIL === undefined || process.env.DISCORD_EMAIL === "") questions.push({ type: 'input', name: 'email', message: 'Entrez votre email :' });
    if (process.env.DISCORD_PASSWORD === undefined || process.env.DISCORD_PASSWORD === "") questions.push({ type: 'password', name: 'password', message: 'Entrez votre mot de passe :', mask: '*' });

    let answer = await inquirer.prompt(questions);

    if (process.env.DISCORD_EMAIL !== undefined && process.env.DISCORD_EMAIL !== "") answer.email = process.env.DISCORD_EMAIL;
    if (process.env.DISCORD_PASSWORD !== undefined && process.env.DISCORD_PASSWORD !== "") answer.password = process.env.DISCORD_PASSWORD;

    if (answer.email === "") answer.email = " ";
    if (answer.password === "") answer.password = " ";

    return { email: answer.email, password: answer.password };
}

async function invalid(page, divSelector) {
    return await page.evaluateHandle((selector) => {
        const element = document.querySelector(selector);
        return element;
    }, divSelector);
}

async function findButton(page, divSelector) {
    return await page.evaluateHandle((selector) => {
        const element = document.querySelector(selector);
        return element;
    }, divSelector);
}

async function guyExist(page, divSelector) {
    return await page.evaluateHandle((selector) => {
        const element = document.querySelector(selector);
        return element;
    }, divSelector);
}

async function discord_puppeteer() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(discordLogin, { waitUntil: 'domcontentloaded' });
    await page.setViewport({ width: 800, height: 800 })
    let connexionBoolean = true;
    while(connexionBoolean) {
        const { email, password } = await askCredentials();

        await page.waitForSelector(discordQuerySelectors.email);
        const input_email = await page.$(discordQuerySelectors.email);
        await input_email.type(email);

        await page.waitForSelector(discordQuerySelectors.password);
        const input_password = await page.$(discordQuerySelectors.password);
        await input_password.type(password);

        const button_connexion = await findButton(page, discordQuerySelectors.connexion);
        await button_connexion.click();

        await waitFor(2000);

        const isCaptcha = await invalid(page, discordQuerySelectors.captcha);

        const isInvalid = await invalid(page, discordQuerySelectors.invalid);

        if (Object.keys(isInvalid).length !== 0 || Object.keys(isCaptcha).length !== 0) {
            connexionBoolean = true;
            await page.reload();
            continue;
        }

        await waitFor(2000);
    
        const button_verify_other = await findButton(page, discordQuerySelectors.verify_other);
        if (Object.keys(button_verify_other).length !== 0) {
            connexionBoolean = false;
        }
        await button_verify_other.click();
        
        await waitFor(1000);
    
        const button_a2f = await findButton(page, discordQuerySelectors.a2f);
        await button_a2f.click(button_a2f);
        
        await waitFor(1000);
        
        const { a2f } = await askA2f();
    
        await page.waitForSelector(discordQuerySelectors.input_a2f);
        const input_a2f = await page.$(discordQuerySelectors.input_a2f);
        await input_a2f.click({ clickCount: 3 })
        await input_a2f.type(a2f);
        
        const button_a2f_confirm = await findButton(page, discordQuerySelectors.a2f_confirm);
        await button_a2f_confirm.click();
    
        await waitFor(2000);
    
        const isInvalida2f = await invalid(page, discordQuerySelectors.a2fInvalid);
    
        if (Object.keys(isInvalida2f).length !== 0) {
            connexionBoolean = true;
            await page.reload();
            continue;
        } 

        connexionBoolean = false;
    } 

    let isAnoying_people = true;
    while(isAnoying_people) {
        anoying_people = (await askAnoyingPeople()).anoying_people

        await page.waitForSelector(discordQuerySelectors.list_people);
    
        const tous_div = await findButton(page, discordQuerySelectors.tous_div);
        await tous_div.click();
    
        await page.waitForSelector(discordQuerySelectors.search_anoying_people);
        const input_search = await page.$(discordQuerySelectors.search_anoying_people);
        await input_search.click({ clickCount: 3 })
        await input_search.type(anoying_people);
    
        await waitFor(1000);

        async function getAnoying_guy(page, divSelector, divSelectorsearch_anoying_people) {
            return await page.evaluateHandle((divSelector, divSelectorsearch_anoying_people) => {
                const input_search = document.querySelector(divSelector);
                const anoying_people = input_search.value;
    
                const list_anoying_guys= document.querySelectorAll(divSelectorsearch_anoying_people)
                let anoying_guy;
                for (const user of list_anoying_guys) {
                    if (user.innerText !== anoying_people) continue;
                    anoying_guy = user;
                }
                
                return anoying_guy;
            }, divSelector, divSelectorsearch_anoying_people);
        }
        const final_anoying_guy = await getAnoying_guy(page, discordQuerySelectors.search_anoying_people, discordQuerySelectors.list_anoying_guys);

        if (Object.keys(final_anoying_guy).length === 0 ) {
            isAnoying_people = true;
            await page.reload();
            console.log("Vous n'avez pas '" + anoying_people + "' en ami ou il n'existe pas")
            continue;
        }  else {
            await final_anoying_guy.click();
        }
        
        isAnoying_people = false;
    }

    await waitFor(1000);
    let message_infos = await getMessageInfos(page, discordQuerySelectors.last_message);

    while (true) {
        log("AI waiting...");
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
        user = document.querySelector('section>div>div>div>div>div').innerText

        const list_message = document.querySelectorAll(lastMessage);
        const anoying_list_message = [];

        let last_message_user_span = null;

        for (const message of list_message) {
            let new_message_user_span = message.querySelector('div>div>h3>span>span');
            if (!new_message_user_span) {
                if (!last_message_user_span) continue;
                new_message_user_span = last_message_user_span;
            }
            last_message_user_span = new_message_user_span;
            const message_user = new_message_user_span.innerText;
            if (message_user == user) continue;
            anoying_list_message.push(message);
        }

        const last_message = anoying_list_message[anoying_list_message.length-1];
        if (!last_message) {
            return {
                id: "",
                text: "",
            }
        }
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

function log(log) {
    process.stdout.write(`\r${log}`);
}

async function main() {
    if (!MODEL) {
        console.log("mettez un MODEL dans le .env");
        return;
    }

    await configOllama(config_model);
    discord_puppeteer();
}

const MODEL = process.env.OLLAMA_MODEL || null;
const annoyingModel = `${MODEL}-Annoying`;

async function configOllama(config) {
    const ollama_list = await ollama.list();
    let isAnnoyingModelExist = "";
    for (const element of ollama_list.models) {
        if (element.name !== annoyingModel) continue;
        isAnnoyingModelExist = element.name;
    }

    if (isAnnoyingModelExist === annoyingModel) ollama.delete({ model: annoyingModel });

    const modelfile = `
        FROM ${MODEL}
        SYSTEM "${config}"
        `
    await ollama.create({ model: annoyingModel, modelfile: modelfile })
}

async function handleOllama(question) {
    const message = { role: 'user', content: question }
    log("AI writing...");
    const response = await ollama.chat({ model: MODEL, messages: [message], stream: true })
    let text = "";
    for await (const part of response) {
        text += part.message.content;
    }
    return text;
}

main()
