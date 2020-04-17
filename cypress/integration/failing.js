let username = "cypressbug";
let password = "9tdLkW8hM4*i";

function htmlFromBody(body) {
    let html = document.createElement('html');
    html.innerHTML = body;
    return html;
}

function htmlFormToDict(form) {
    let data = {};
    for (let i = 0; i < form[0].elements.length; i++) {
        let e = form[0].elements[i];
        if (e.type !== "submit" && e.type !== "fieldset") {
            data[e.name] = e.value;
        }
    }
    return data;
}

Cypress.Commands.add('submitForm', (action, data) => {
    return cy.request({
    })
});

describe('Bug?', () => {
    it('View low latency broadcast (replay)', () => {
        // programmatically login to Periscope via Twitter
        cy.clearCookies({"domain": "twitter.com"})
        cy.clearCookies({"domain": "periscope.tv"})
        
        cy.visit("https://www.periscope.tv")
        cy.request("https://www.periscope.tv").then((response) => {
            cy.getCookie("pscp-csrf").then((cookie) => {
                let loginUrl = 'https://www.periscope.tv/i/twitter/login?csrf=' + cookie.value;
                cy.request(loginUrl).then((response) => {
                    let html = htmlFromBody(response.body);
                    let twUrl = html.getElementsByTagName('meta')[0].content.split(";")[1];
                    cy.request(twUrl).then((response) => {
                        let html = htmlFromBody(response.body);
                        let form = html.getElementsByTagName('form');
                        let action = form[0].action;
                        let data = htmlFormToDict(form);
                        data["session[username_or_email]"] = username;
                        data["session[password]"] = password;
                        cy.request({
                            method: 'POST',
                            form: true,
                            body: data,
                            url: action,
                        }).then((response) => {
                            let el = document.createElement('html');
                            el.innerHTML = response.body;
                            let metas = el.getElementsByTagName('meta');
                            for (let i = 0; i < metas.length; i++) {
                                if (metas[i].httpEquiv === "refresh") {
                                    let pscpUrl = metas[i].content.split(";")[1];
                                    pscpUrl = pscpUrl.slice(4, pscpUrl.length);
                                    cy.request(pscpUrl)
                                }
                            }
                        })
                    })
                })
            })
        });

        let condition = 0
        if (condition === 0) {
            // this doesn't work
            cy.visit("https://www.periscope.tv/cb")
            cy.get("#Oval").click({force: true})
        } else if (condition === 1) {
            // this works as expected
            cy.clearCookies()  // removing this line will make the test fail
            cy.visit("https://www.periscope.tv/cb")
            cy.get("#Oval").click({force: true})
        } else {
            // this works as expected
            cy.visit("https://www.periscope.tv")
        }

        cy.server();
        var caughtAnXhr = false;
        cy.route({
            method: 'GET',
            url: '/**/*',
            onResponse: (xhr) => {
                caughtAnXhr = true;
            }
        });
        cy.wait(3000).then(() => {
            expect(caughtAnXhr).to.eq(true);
        });
    })
});
