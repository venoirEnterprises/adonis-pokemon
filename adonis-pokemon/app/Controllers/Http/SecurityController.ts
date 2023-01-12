import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PokeTrainer from "App/Models/PokeTrainer";

export default class SecurityController {
    public async login({ request, auth }: HttpContextContract) {

        const email = request.input("email");
        const password = request.input("password");
        
        const token = await auth.use("api").attempt(email, password, {
            expiresIn: "10 days",
            });
            return token.toJSON();
    }
    
    public async register({ request, auth }: HttpContextContract) {
        
        const user = new PokeTrainer();
        user.password = request.input("password");
        user.name = request.input("name");
        await user.save();
        
        const token = await auth.use("api").login(user, {
        	expiresIn: "10 days",
        });
        
        return token.toJSON();
    }
}