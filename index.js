const fetch = require('node-fetch')
const fs = require('fs');

async function main() {
    const config = {
        url: 'https://seudominio.zendesk.com',
        email: 'seuemail@seudominio.com',
        token: 'SeuTokenDeConsudoDaAPI',
        language: 'pt-br'
    }

    // DATA STRUCTURE //

    const content = {
        categories : [
            // {
            //     id : 0, 
            //     name : ''
            // }
        ],
        sections : [
            // {
            //     id : 0, 
            //     name : '',
            //     category_id : 0
        ],
        articles : [
            // {
            //     name : '',
            //     body : '',
            //     section_id : 0
            // }
        ]
    }

    content.categories = await getCategories(config)
    content.sections = await getSections(config)
    content.articles = await getArticles(config)

    const repositoryTree = await createRepositoryTree(content)

    await saveInRepository(repositoryTree)
}

async function createRepositoryTree(content) {
    const repositoryTree = {}

    content.categories.forEach(categorie => {
        let categorieNameSanitezed = categorie.name.replace(/[\\/:*"<>|?]/g, ' ')

        repositoryTree[categorieNameSanitezed]  = {}

        content.sections.forEach(section => {
            let sectionNameSanitezed = section.name.replace(/[\\/:*"<>|?]/g, ' ')

            if(section.category_id === categorie.id){
                repositoryTree[categorieNameSanitezed][sectionNameSanitezed] = {} 

                content.articles.forEach(article => {
                    let articleNameSanatized = article.name.replace(/[\\/:*"<>|?]/g, ' ') + '.html'

                    if(article.section_id === section.id) {
                        repositoryTree[categorieNameSanitezed][sectionNameSanitezed][articleNameSanatized] = article.body
                    }
                })
            }
        })
    })

    return repositoryTree
}

async function createRepository(dir){
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
}

async function createArticle(path, body){

    fs.writeFile(path, body, err => {
        if(err) throw err
    })
}

async function saveInRepository(repositoryTree){

    console.log('Salvando Arquivos...')

    const dirRoot = 'conteudo'

    await createRepository(dirRoot)

    for (const categorie in repositoryTree) {
        let dirCategorie = `${dirRoot}/${categorie}`
        
        await createRepository(dirCategorie)

        for (const section in repositoryTree[categorie]) {
            let dirSection = `${dirCategorie}/${section}`
            
            await createRepository(dirSection)

            for (const article in repositoryTree[categorie][section]) {
                let path = `${dirSection}/${article}`
                let body = repositoryTree[categorie][section][article]

                await createArticle(path, body)
            }
        }
    }

}

async function getCategories({ url, email, token, language }) {

    const authString = `${email}/token:${token}`

    const config = {
        method : 'GET',
        headers : {
            Authorization : 'Basic '+ Buffer.from(authString).toString('base64')
        }
    }

    let endpoint = url + `/api/v2/help_center/${language}/categories.json`

    const categories = []

    while(endpoint){
        console.log(`Capturando categorias de: ${endpoint}`)
        
        const response = await fetch(endpoint, config)
    
        if(response.status >= 400){
            console.log(`Error: ${response.status}`)
            break
        }
        
        const json = await response.json()
        
        json.categories.forEach(categorie => {
            categories.push({
                id : categorie.id,
                name : categorie.name
            })
        })

        endpoint = json.next_page
    }

    console.log(`${categories.length} categorias capturadas!\n`)

    return categories
}

async function getSections({ url, email, token, language }) {

    const authString = `${email}/token:${token}`

    const config = {
        method : 'GET',
        headers : {
            Authorization : 'Basic '+ Buffer.from(authString).toString('base64')
        }
    }

    let endpoint = url + `/api/v2/help_center/${language}/sections.json`
    
    const sections = []

    while(endpoint){

        console.log(`Capturando seções de: ${endpoint}`)
        
        const response = await fetch(endpoint, config)
    
        if(response.status >= 400){
            console.log(`Error: ${response.status}`)
            break
        }
        
        const json = await response.json()
        
        json.sections.forEach(section => {
            sections.push({
                id : section.id,
                name : section.name,
                category_id : section.category_id
            })
        })

        endpoint = json.next_page
    }

    console.log(`${sections.length} seções capturadas!\n`)

    return sections
}

async function getArticles({ url, email, token, language }) {

    const authString = `${email}/token:${token}`

    const config = {
        method : 'GET',
        headers : {
            Authorization : 'Basic '+ Buffer.from(authString).toString('base64')
        }
    }

    var endpoint = url + `/api/v2/help_center/${language}/articles.json`

    const articles = []

    while(endpoint){
        console.log(`Capturando artigos de: ${endpoint}`)
        
        const response = await fetch(endpoint, config)
    
        if(response.status >= 400){
            console.log(`Error: ${response.status}`)
            break
        }
        
        const json = await response.json()
        
        json.articles.forEach(article => {
            articles.push({ 
               name : article.name,
               body : article.body,
               section_id : article.section_id
            })
        })

        endpoint = json.next_page
    }

    console.log(`${articles.length} artigos capturados!\n`)

    return articles
}

main()