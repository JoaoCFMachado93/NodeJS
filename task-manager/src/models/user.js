const validator = require('validator')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        require: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email not valid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age cant be negative number')
            }
        }
    },
    password: {
        type: String,
        require: true,
        minLength: 7,
        trim: true,
        validate(value) {
            if (validator.contains(value, 'password', { ignoreCase: true })) {
                throw new Error('Password cant contain password')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            require: true
        }
    }]
})


//generate token for login
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user.id.toString() }, 'thisismytokenforlogin')

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

//log in
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Incorrect email!')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('Incorrect password!')
    }

    return user
}

//Hash password
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User