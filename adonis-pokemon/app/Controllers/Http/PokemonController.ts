import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Pokemon from 'App/Models/Pokemon'

export default class PokemonController {

    public async create({request}: HttpContextContract) {
        const pokemon = new Pokemon();
        pokemon.officialName = 'squirtle';
        pokemon.type = 'water';
        await pokemon.save();

        return pokemon.id;
    }

    public async get({params}: HttpContextContract)
    {
        try {
            const pokemon = await Pokemon.find(params.id);
            if(pokemon) {
                return pokemon;
            }
        } catch (error) {
            return 'handle not found error with 404 header';
        }
    }
}
