import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Pokemon from 'App/Models/Pokemon'
import FriendlyPokemonForResponse from 'App/Models/FriendlyPokemonForResponse'
import { Type } from 'App/Models/Type';

export default class PokemonController {

    public async add({auth, response, request}: HttpContextContract) {
        
        const user = await auth.authenticate();
        
        const officialName = request.input("officialName");
        const petName = request.input("petName");
        const type:string = request.input("type");

        if(this.typeFound(type, response)) {

            if(officialName == null || type == null) {
                return response.status(400).send({"error":"Both the type and official name are required to add a pokemon"});
            }

            const pokemon = new Pokemon();
            pokemon.officialName = officialName;
            pokemon.petName = petName == null ? officialName : petName;
            pokemon.type = type;
            pokemon.pokeTrainerId = user.id;

            if(pokemon.petName != officialName) {

                const pokemonWithPetName = await Database.from("pokemon")
                    .where((query) => { query.where("pet_name", petName)})
                    .andWhere((query) => {  query.where("poke_trainer_id", user.id)})

                if(pokemonWithPetName.length !== 0) {// only one pokemon per pet name per person
                    return response.status(400).send({"error":"You already have a pokemon with that pet name"});
                }
            }
            
            await pokemon.save();

            return this.createFriendlyPokemonModelForDisplay(pokemon);
        }
    }

    public async getById({response, params}: HttpContextContract)
    {
        try {
            const pokemon = await Pokemon.find(params.id);
            if(pokemon) {
                return this.createFriendlyPokemonModelForDisplay(pokemon);
            }
            else {
                this.handledNotFoundError(response, false);
            }
        } catch (error) {
            this.handledNotFoundError(response, false);
        }
    }

    public async getAll({auth, response}: HttpContextContract) {
        
        const user = await auth.authenticate();

        const getAllPokemonForUser = await Pokemon.query()
            .where('pokeTrainerId', '=', user.id)
            .orderBy("updated_at", "desc");

        return this.convertQueryResultToFriendlyModelsForDisplay(getAllPokemonForUser, response);
    }

    public async search({auth, response, request}: HttpContextContract) {

        const user = await auth.authenticate();

        const type:string = request.input("type");
        const name = request.input("name");

        
        if(name == null && type == null) {
            return response.status(400).send({"error":"Either a type or name is needed to search. If you want all your pokemon, try /getAll"});
        }

        if(type == null || this.typeFound(type, response)) {
            const getAllPokemonForUserBySearchFilters = Pokemon.query();

            if(name != null) {
                getAllPokemonForUserBySearchFilters.andWhere('officialName', 'like', '%'+name+'%')
                getAllPokemonForUserBySearchFilters.orWhere('petName', 'like', '%'+name+'%')
            }
            if(type != null) {
                getAllPokemonForUserBySearchFilters.where('type', '=', type)
            }
            getAllPokemonForUserBySearchFilters
                .where('pokeTrainerId', '=', user.id)
                .orderBy("updated_at", "desc");
            
            // await Database.from("pokemon")
            // .where((query) => { query.where("pet_name", 'like', '%'+name+'%')})
            // .where((query) => { query.where("official_name", 'like', '%'+name+'%')})
            // .where((query) => { query.where("type", type)})

// return response.status(200).send(name != null)
            return this.convertQueryResultToFriendlyModelsForDisplay(await getAllPokemonForUserBySearchFilters, response);
        }
    }

    private convertQueryResultToFriendlyModelsForDisplay(queryResults: Pokemon[], response) {  
        this.handleNoPokemonFound(queryResults, response);

        let allPokemonForQueryResult: FriendlyPokemonForResponse[] = [];
        queryResults.forEach(pokemonForUser => {            
            allPokemonForQueryResult.push(this.createFriendlyPokemonModelForDisplay(pokemonForUser));
        });
        return allPokemonForQueryResult;
    }

    private createFriendlyPokemonModelForDisplay(pokemon: Pokemon): FriendlyPokemonForResponse {
        let friendlyPokemonForResponse = new FriendlyPokemonForResponse();
        friendlyPokemonForResponse.id = pokemon.id;
        friendlyPokemonForResponse.type = pokemon.type;
        if(pokemon.petName !== pokemon.officialName) {
            friendlyPokemonForResponse.petName = pokemon.petName;
        }
        friendlyPokemonForResponse.officialName = pokemon.officialName;

        return friendlyPokemonForResponse;
    }

    private handleNoPokemonFound(getPokemonResult: any[], response):void {
        if(getPokemonResult.length === 0) {
            return response.status(200).send({"error":"No pokemon found"});
        }
    }

    private typeFound(type: string, response): boolean {        
        if(!Object.values(Type).includes(type.toUpperCase())) {
            response.status(400).send({"error":"Pokemon type not found"});
            return false;
        }
        return true;
    }

    private handledNotFoundError(response, searching: boolean): void {
        console.log("error");
        let errorMessage = "Sorry, that Pokemon cannot not found.";
        if(!searching) {
            errorMessage = errorMessage.concat(" Try searching via search using the pet's name(s) or their type.");
        }
        response.status(404).send({"error":errorMessage});
    }
}
