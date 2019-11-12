import { isUndefined, isNull } from "util";
import { injectable, inject } from "inversify";
import TYPES from "../../types";
import AuthenticationService from "./AuthenticationService";
import TokenService from "./TokenService";
import HashService from "./HashService";
import Session from "../../Domain/Entities/Session";
import User from "../../Domain/Entities/User";


@injectable()
class AuthenticationServiceImpl implements AuthenticationService {

    private readonly tokenService: TokenService;
    private readonly hashService: HashService;


    constructor(
        @inject(TYPES.TokenService) tokenService: TokenService,
        @inject(TYPES.HashService) hashService: HashService
    ) {
        this.tokenService = tokenService;
        this.hashService = hashService;
    }


    public async login(user: User, password: string): Promise<Session | null> {
        if (isUndefined(user) || isNull(user)) {
            throw new Error().message = "Cannot generate token for invalid user.";
        }
        if (isUndefined(password) || isNull(password)) {
            throw new Error().message = "Invalid password.";
        }
        
        const pass = this.hashService.getStringHash(password);
        if (pass.valueOf() === user.pass.valueOf()) {
            const token = this.tokenService.getToken();
            const session = new Session(user.id, token);
            await session.save();
            return session;
        }
        else {
            return null;
        }
    }

    public async logout(user: User, session: Session): Promise<void> {
        if (isUndefined(user) || isNull(user)) {
            throw new Error().message = "Invalid user.";
        }
        if (isUndefined(session) || isNull(session)) {
            throw new Error().message = "Invalid session.";
        }

        let storedSession: Session | undefined = await this.readSession(user);
        if (!isUndefined(storedSession) && session.equals(storedSession)) {
            await session.remove();
        }
    }

    public async readSession(user: User): Promise<Session | undefined> {
        if (isUndefined(user) || isNull(user)) {
            throw new Error().message = "Invalid user.";
        }

        return await Session.findOne({ userId: user.id });
    }

    public async isLoggedIn(session: Session): Promise<boolean> {
        if (isUndefined(session) || isNull(session)) {
            throw new Error().message = "Invalid session.";
        }

        const sessions = await Session.find(
            { where: { id: session.userId, token: session.token } });
        // This is necessary because TypeOrm fails to the above query correctly
        return sessions.length > 0 && session.equals(sessions[0]);
    }

}

export default AuthenticationServiceImpl;
