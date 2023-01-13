import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PokeTrainer from "App/Models/PokeTrainer";

export default class SecurityController {
    public async login({ response, request, auth }: HttpContextContract) {

        const name = request.input("name");
        const password = request.input("password");

        if(!this.areRequiredFieldsMissing(name, password, response)) {
            const token = await auth.use("api").attempt(name, password, {
                expiresIn: "10 days",
                });
                return token.toJSON();
        }
    }
    
    public async register({ request, auth, response }: HttpContextContract) {

        const name = request.input("name"); 
        const password = request.input("password");

        if(!this.areRequiredFieldsMissing(name, password, response)) {   
            const user = new PokeTrainer();        
            user.name = name;
            user.password = password;
            await user.save();
            
            const token = await auth.use("api").login(user, {
                expiresIn: "10 days",
            });
            
            return token.toJSON();
        }
    }

    private areRequiredFieldsMissing(name, password, response) {
        if(name == null || password == null) {
            response.status(400).send({"error":"You must supply your name and password to register"});
            return true;
        } else {
            return false;
        }
    }
}