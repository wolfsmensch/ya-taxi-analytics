const mysql = require('mysql');
require('dotenv').config();

class DataBase {
    static #instance = null;
    #pool;

    constructor()
    {
        const dbAccess = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '8099',
            database: process.env.DB_NAME || 'ya_taxi_analytics',
        };

        console.log('Connecting to DataBase');
        console.log(`   Host: ${dbAccess.host}`)
        console.log(`   DataBase Name: ${dbAccess.database}`)
        console.log(`   User: ${dbAccess.user}`)

        this.#pool = mysql.createPool(dbAccess);
        this.#pool.on('error', (err) => {
            console.error(`Database fatal error: ${err.code}`);
        });

        /*this.#connection = mysql.createConnection(dbAccess);

        this.#connect();*/
    }

    static getInstance()
    {
        if (this.#instance == null)
        {
            this.#instance = new DataBase();
        }

        return this.#instance;
    }

    #connect()
    {
        return new Promise((resolve, reject) => {
            console.log('Getting new DB connection');
            this.#pool.getConnection((err, connect) => {
                if (err)
                {
                    reject(err);
                }
                
                console.log(`DB Connection Established: ${connect.threadId}`);
                resolve(connect);
            });
        });
    }

    query( sqlCommand )
    {
        console.log(`SQL query: ${sqlCommand}`);

        return new Promise( (resolve, reject) => {
            this.#connect()
                .then(connect => {
                    connect.query( sqlCommand, (error, results) => {
                        if (error)
                        {
                            reject(error);
                        }
        
                        resolve(results);
                        connect.release(err => {
                            if (err)
                            {
                                console.error('Unable to release DB connection: ', err);
                            }
                        });
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    queryWhere( sqlCommand, whereParams )
    {
        console.log(`SQL query: ${sqlCommand} with WHERE parameters`, whereParams);

        sqlCommand += ' WHERE ' + Object.keys(whereParams).map((value) => '`' + value + '` = ?').join(' AND ');
        console.log(`Performed SQL query: ${sqlCommand}`);

        return new Promise( (resolve, reject) => {
            this.#connect()
                .then(connect => {
                    connect.query( sqlCommand, Object.values(whereParams), (error, results) => {
                        if (error)
                        {
                            reject(error);
                        }
        
                        resolve(results);
                        connect.release(err => {
                            if (err)
                            {
                                console.error('Unable to release DB connection: ', err);
                            }
                        });
                    });
                })
                .catch(err => {
                    reject(err);
                });            
        });
    }

    insert( tableName, data )
    {
        console.log(`SQL insert query: table [${tableName}]`, data);

        return new Promise( (resolve, reject) => {
            this.#connect()
                .then(connect => {
                    connect.query(`INSERT INTO ${tableName} SET ?`, data, (error, results) => {
                        if (error)
                        {
                            reject(error);
                            return;
                        }
        
                        resolve(results.insertId);
                        connect.release(err => {
                            if (err)
                            {
                                console.error('Unable to release DB connection: ', err);
                            }
                        });
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    update(tableName, updatiableFields, whereFields)
    {
        console.log('SQL update query');
        console.log('   Table: ', tableName);
        console.log('   UPDATE Fields: ', updatiableFields);
        console.log('   WHERE Fields: ', whereFields);

        let sqlCommand = `UPDATE ${tableName} `;
        sqlCommand += 'SET ' + Object.keys(updatiableFields).map((value) => value + ' = ?').join(', ') + ' ';
        sqlCommand += 'WHERE ' + Object.keys(whereFields).map((value) => value + ' = ?').join(' AND ');

        const fieldsValues = (Object.values(updatiableFields)).concat(Object.values(whereFields));

        console.log(`Generated SQL query: ${sqlCommand}`);
        console.log('   With values: ', fieldsValues);

        return new Promise( (resolve, reject) => {
            this.#connect()
                .then(connect => {
                    connect.query( sqlCommand, fieldsValues, (error) => {
                        if (error)
                        {
                            reject(error);
                        }
        
                        resolve(true);
                        connect.release(err => {
                            if (err)
                            {
                                console.error('Unable to release DB connection: ', err);
                            }
                        });
                    });
                })
                .catch(err => {
                    reject(err);
                })
        });
    }

    async execTransaction(func)
    {
        // TODO: Переделать транзакции под использование пула соединений
        console.log('execTransaction - not fully implemented method');
        return func();

        /*console.log('Beginning transaction');
        await this.#connection.beginTransaction();

        try {
            await func();
        } catch (error) {
            console.error('Transaction error: ', error);
            await this.#connection.rollback();
            throw error;
        }

        console.log('Commiting transaction');
        await this.#connection.commit();
        console.log('Done');*/
    }

    checkStatus()
    {
        return new Promise( (resolve, reject) => {
            console.log('Checking DataBase status...');
            this.#connect()
                .then(connect => {
                    connect.query('SHOW TABLES', (error) => {
                        if (error)
                        {
                            console.error('DataBase Status: ERROR');
                            resolve(false);
                        }
                        else
                        {
                            console.log('DataBase Status: OK');                
                            resolve(true);
                        }

                        connect.release(err => {
                            if (err)
                            {
                                console.error('Unable to release DB connection: ', err);
                            }
                        });
                    });
                })
                .catch(err => {
                    console.error('DataBase Status: ERROR');
                    resolve(false);
                })
        });
    }

    // Приведение даты к формату YYYY-MM-DD hh:mm:ss
    static DateTimeToSqlFormat(date)
    {
        return date.getFullYear() + '-' +
            ('00' + (date.getMonth()+1)).slice(-2) + '-' +
            ('00' + date.getDate()).slice(-2) + ' ' + 
            ('00' + date.getHours()).slice(-2) + ':' + 
            ('00' + date.getMinutes()).slice(-2) + ':' + 
            ('00' + date.getSeconds()).slice(-2);
    }
}

module.exports = DataBase.getInstance();