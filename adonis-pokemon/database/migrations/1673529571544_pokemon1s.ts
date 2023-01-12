import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'pokemon'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.string("pet_name", 255).nullable();
      table.string("official_name", 255).notNullable();
      table.string("type", 255).notNullable();
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
