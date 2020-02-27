// We load the configuration data
require('dotenv').config();

// get the mysql client and the axios client
const mysql = require('mysql2');
const axios = require('axios');


const url = process.env.URL;
const x_api_key = process.env.X_API_KEY;
axios.defaults.headers.common['x-api-key'] = x_api_key;

// create the connection to database
const connectionData = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
};
console.log(connectionData);
const connection = mysql.createConnection(connectionData);

// Get all the bank accounts from the database.
function queryBankAccounts() {
    return new Promise((resolve, reject) => {
        // simple query
        connection.query(
            `SELECT rutDestinatario, numeroCuenta, codigoSBIF 
            FROM user_bank_accounts, global_instituciones_financieras
            where idInstitucion = global_instituciones_financieras.id`,
            function (err, results, fields) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results)
                }


            }
        );
    })
}
//Validate the account against the api service.
function validateAccount(element) {
    return new Promise((resolve, reject) => {
        axios.post(url + '/validations/BankAccount', {
                rut: element.rutDestinatario,
                bankData: {
                    bankSBIFNumber: element.codigoSBIF,
                    bankAccount: element.numeroCuenta
                }
            })
            .then(function (response) {
                // console.log(response);
                resolve(response);
            })
            .catch(function (error) {
                // console.log(error);
                reject(error);
            });
    })
}

//We validate all the bank accounts that we have on our database against the service. We don't do anything wit that validation.
queryBankAccounts().then(async (queryResults) => {
    // console.log(queryResults);
    for (let index = 0; index < queryResults.length; index++) {
        const element = queryResults[index];
        try {
            const resultadoValidacion = await validateAccount(element);
            console.log(index, queryResults.length - 1, resultadoValidacion.data);
        } catch (error) {
            console.log("ERROR", error.response.status,error.response.statusText);
        }

    }
    process.exit();

}).catch(errorQuery => {
    console.log(errorQuery);
    process.exit();
});