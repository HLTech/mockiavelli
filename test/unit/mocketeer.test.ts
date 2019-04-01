import {Mocketeer} from "../../src";

describe('Mocketeer', () => {

    describe(".activate", () => {

        it(".calls page.setRequestInterception and page.on ", async () => {
            const mocketeer = new Mocketeer({origin: "http://localhost"});
            const page = {setRequestInterception: jest.fn(), on: jest.fn()};
            await mocketeer.activate(page as any);
            expect(page.setRequestInterception).toHaveBeenCalledWith(true);
            expect(page.on).toHaveBeenCalledWith('request', expect.any(Function));
        });

    });

});