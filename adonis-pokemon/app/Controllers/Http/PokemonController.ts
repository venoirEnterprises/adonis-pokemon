import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Pokemon from 'App/Models/Pokemon'

export default class PokemonController {

    public async create({request}: HttpContextContract) {
        const pokemon = new Pokemon();
        pokemon.officialName = request.input("officialName");
        pokemon.type = 'water';
        await pokemon.save();

        return pokemon.id;
    }

    public async get(ctx: HttpContextContract)
    {
        try {
            const pokemon = await Pokemon.find(ctx.params.id);
            if(pokemon) {
                return pokemon;
            }
            else {
                this.handledNotFoundError(ctx, false);
            }
        } catch (error) {
            this.handledNotFoundError(ctx, false);
        }
    }

    private handledNotFoundError(ctx: HttpContextContract, searching: boolean): void {
        console.log("error");
        let errorMessage = "Sorry, that Pokemon cannot not found.";
        if(!searching) {
            errorMessage = errorMessage.concat("\nTry searching via /search using the pet's name(s) or their type.")
        }
        ctx.response.status(404).send(errorMessage);
    }
}
