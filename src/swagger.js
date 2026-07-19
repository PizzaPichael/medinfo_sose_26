import swaggerJsdoc from 'swagger-jsdoc'

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MedInfo API',
            version: '1.0.0'
        }
    },
    apis: ['./src/server.js']
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
