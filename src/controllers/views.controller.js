export default class viewscontroller {
    controllerRenderRegister = (req, res) => {
        try {
            res.render("register");
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    controllerRenderLogin = (req, res) => {
        try {
            res.render("login");
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    controllerRenderProfile = (req, res) => {
        try {
            const userData = req.session.user;
            res.render('profile', { userData });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    controllerRenderReset = (req, res) => {
        try {
            res.render("reset-password-send-email");
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};