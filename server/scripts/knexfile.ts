/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
  client: 'better-sqlite3',
  connection: {
    filename: '../data/db.sqlite'
  }
};
