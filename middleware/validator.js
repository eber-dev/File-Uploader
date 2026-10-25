import { body, validationResult } from 'express-validator';

export const validarRegistro = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Es obligatorio')
        .bail()
        .isEmail()
        .withMessage('El correo no tiene un formato válido'),
    body('name').trim().notEmpty().withMessage('Es obligatorio'),
    body('password')
        .notEmpty()
        .withMessage('Es obligatorio')
        .bail()
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres'),
    ,
    body('confirm-password')
        .notEmpty()
        .withMessage('Debes confirmar la contraseña')
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    ,
    (res, req, next) => {
        const errores = validationResult(req);

        if (!errores.isEmpty) {
            console.log(errores.array().map((e) => e.msg));

            return res.status(400).render('', {
                errors: errores.array(),
                old: req.body,
            });
        }

        next();
    },
];

export const validarLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('El username es obligatorio'),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('La contraseña es obligatoria'),

    (res, req, next) => {
        const errores = validationResult(req);

        if (!errores.isEmpty) {
            console.log(errores.array().map((e) => e.msg));

            return res.status(400).render('', {
                errors: errores.array(),
                old: req.body,
            });
        }

        next();
    },
];
