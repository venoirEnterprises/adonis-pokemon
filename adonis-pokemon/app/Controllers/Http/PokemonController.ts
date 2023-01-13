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
            pokemon.petName = this.getDisplayName(petName, officialName);
            pokemon.type = type;
            pokemon.pokeTrainerId = user.id;

            if(pokemon.petName != officialName) {
                return await this.handleDuplicatePetName(petName, user.id, response);
            }
            
            await pokemon.save();

            return this.createFriendlyPokemonModelForDisplay(pokemon);
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

            return this.convertQueryResultToFriendlyModelsForDisplay(await getAllPokemonForUserBySearchFilters, response);
        }
    }

    public async releaseById({auth, response, params, request}: HttpContextContract) {
        const pokemon = await this.findByIdAndRespond(auth, response, params);
        const confirm = request.input("confirm");
        if(pokemon) {
        let message = this.getDisplayName(pokemon.petName, pokemon.officialName).concat(' [with id: ').concat(pokemon.id.toString()).concat('] ');
            if(confirm == null || confirm != 'true') {
                return response.status(200).send( message.concat('will be released only if you send the confirm param set to true.'));
            } else if (confirm == 'true') {
                pokemon.delete();
                return response.status(200).send( message.concat('successfully released.'));
            }
        } else {
            this.handledNotFoundError(response);
        }
    }

    public async getById({auth, response, params}: HttpContextContract){
        
        const pokemon = await this.findByIdAndRespond(auth, response, params);
        if(pokemon) {
            return this.createFriendlyPokemonModelForDisplay(pokemon);
        } else {
            this.handledNotFoundError(response);
        }
        
    }

    public async rename({auth, response, params, request}: HttpContextContract) {
        
        const user = await auth.authenticate();
        const pokemon = await this.findByIdAndRespond(auth, response, params);
        
        if(pokemon) {
            const petName = request.input('newName');
            const petName2ndOption = request.input('petName');
            const officialName = request.input('officialName');
            const type = request.input('type');
        
            if(petName == null && petName2ndOption == null) {
                return response.status(400).send({"error": "A new name for ".concat(this.getDisplayName(pokemon.petName, pokemon.officialName)).concat(" needs to be provided")});
            }
            if(officialName != null || type != null) {
                return response.status(400).send({"error":"You can only give ".concat(this.getDisplayName(pokemon.petName,pokemon.officialName)).concat(" a new name, not type or official name") });
            }

            if(petName != null || petName2ndOption != null) {
                const newPetName = petName == null ? petName2ndOption : petName;
                if(newPetName != pokemon.petName) {                    
                    await this.handleDuplicatePetName(petName, user.id, response);
                    pokemon.petName = newPetName;
                    await pokemon.save();
                    return this.createFriendlyPokemonModelForDisplay(pokemon);
                }
            }
            return this.createFriendlyPokemonModelForDisplay(pokemon);
        } else {
            this.handledNotFoundError(response);
        }
        
    }

    private async findByIdAndRespond(auth, response, params) {
        
        const user = await auth.authenticate();

        const pokemon = await Pokemon.query()
            .where('pokeTrainerId', '=', user.id)
            .where('Id', params.id)
            .first();

        if(pokemon) {
            return pokemon;
        }
        else {
            this.handledNotFoundError(response);
        }
    }

    private async handleDuplicatePetName(petName, userId, response) {
        const pokemonWithPetName = await Pokemon.query()
            .where('pokeTrainerId', '=', userId)
            .where("petName", "=", petName);

        if(pokemonWithPetName.length !== 0) {// only one pokemon per pet name per person
            return response.status(400).send({"error":"You already have a pokemon with that pet name"});
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

    private handledNotFoundError(response): void {
        response.status(404).send({"error":"Sorry, that Pokemon cannot not found. Try searching via search using the pet's name(s) or their type."});
    }

    private getDisplayName(petName, officialName): string {
        return petName == null ? officialName : petName;
    }
}
