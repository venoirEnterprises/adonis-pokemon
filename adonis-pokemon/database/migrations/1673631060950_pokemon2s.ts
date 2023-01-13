import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Pokemon2S extends BaseSchema {
  protected tableName = 'pokemon'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('poke_trainer_id').unsigned().references('id').inTable('poke_trainers').onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('poke_trainer_id');
    })
  }
}
