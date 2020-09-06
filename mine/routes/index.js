const express = require('express')
const route = express.Router()
const User = require('../models/user')
const Post = require('../models/post')
const session = require('express-session')

// Get /logout
route.get('/logout', (req, res, next) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) return next(err)
            return res.redirect('/')
        })
    }
})

// Get /profile
route.get('/profile', (req, res, next) => {
    // return res.render('profile',{title:'Profile'})
    if (!req.session.userID) {
        return res.redirect('/login')
    }
    User.findById(req.session.userID)
        .exec((err, user) => {
            if (err) return next(err)
            var arrayOfTodos = [];
            Post.find().then((posts) => {


                posts.forEach(function(element) {
                    // console.log(element.email)
                    if (user.email == element.email)
                        arrayOfTodos.push(element);
                })
            })


            return res.render('profile', { title: 'Profile', name: user.name, people: arrayOfTodos })
        })
})

// GET /login
route.get('/login', (req, res, next) => {
        return res.render('login', { title: 'Log In' })
    })
    // POST /login
route.post('/login', (req, res, next) => {
        if (req.body.email && req.body.password) {
            User.authenticate(req.body.email, req.body.password, (err, user) => {
                if (err || !user) {
                    let err = new Error('Wrong Email or Password')
                    err.status = 401
                    return next(err)
                }

                // sab kuch shi hai then we should create a cookie with userID and redirect to profile
                req.session.userID = user._id
                return res.redirect('/profile')
            })
        } else {
            let err = new Error('You need to enter both email and password')
            err.status = 401 // Means : Forbidden
            return next(err)
        }
    })
    // Get /register
route.get('/register', (req, res, next) => {
        return res.render('signup', { title: 'Sign Up' })
    })
    // Post /register
route.post('/register', (req, res, next) => {
    if (req.body.name && req.body.password && req.body.movie && req.body.email) {
        var userData = {
            name: req.body.name,
            movie: req.body.movie,
            password: req.body.password,
            email: req.body.email
        }
        User.create(userData, (err, user) => {
            if (err) return next(err)
            req.session.userID = user._id
            return res.redirect('/profile')
        })
    } else {
        let err = new Error('You need to enter all the information')
        err.status = 400
        return next(err)
    }
})

// Get /
route.get('/', (req, res, next) => {
    return res.render('index', { title: 'Home Page' })
})

// Get /contact
route.get('/contact', (req, res, next) => {
    return res.render('contact', { title: 'Contact' })
})

// Get /about
route.get('/about', (req, res, next) => {
    return res.render('about', { title: 'About' })
})


//POST ROUTES
route.get('/post', (req, res, next) => {
    if (!req.session.userID) {
        return res.redirect('/login')
    }
    return res.render('post', { title: 'New Post' })
})

route.post('/newpost', (req, res, next) => {

    if (!req.session.userID) {
        return res.redirect('/login')
    }
    if (req.body.body) {

        User.findById(req.session.userID)
            .exec((err, user) => {
                if (err) return next(err)
                var postData = {
                    email: user.email,
                    body: req.body.body,
                    totalLikes: 0,
                    timestamp: new Date()
                }
                Post.create(postData, (err, user) => {
                    if (err) return next(err)
                    req.session.userID = user._id
                        // console.log(postData)

                    return res.redirect('/post')
                })
            })
    } else {
        let err = new Error('You need to enter all the information')
        err.status = 400
        return next(err)
    }
});

// LIKE ROUTES
route.post('/likepost', (req, res, next)=> {
    if (!req.session.userID) {
        return res.redirect('/login')
    }
    if(req.body.postId){
        Post.findById(req.body.postId)
            .exec((err, oldPost) => {
                if (err) return next(err);
                var currLike = oldPost.totalLikes + 1

                User.findById(req.session.userID)
                    .exec((err, user) => {
                        if (err) return next(err)
                        Post.updateOne(
                            {_id:req.body.postId},
                            {
                                $set: { totalLikes: currLike },
                                $push: { usersWhoLiked: {email: user.email} }
                            },
                            function(err,count){
                                if(err) next(err)
                            }
                        )  
                    })
                
                res.json({newLikes:currLike, displayLike:"none", displayUnlike:"inline"})
                return res
            })            
    }
    else{
        let err = new Error('You need to enter all the information')
        err.status = 400
        return next(err)
    }
})

route.post('/unlikepost', (req, res, next)=> {
    if (!req.session.userID) {
        return res.redirect('/login')
    }
    if(req.body.postId){
        Post.findById(req.body.postId)
            .exec((err, oldPost) => {
                if (err) return next(err);
                var currLike = oldPost.totalLikes - 1

                User.findById(req.session.userID)
                    .exec((err, user) => {
                        if (err) return next(err)
                        Post.updateOne(
                            {_id:req.body.postId},
                            {
                                $set: { totalLikes: currLike },
                                $pull: { usersWhoLiked: {email: user.email} }
                            },
                            function(err,count){
                                if(err) next(err)
                            }
                        )  
                    })
                
                res.json({newLikes:currLike, displayLike:"inline", displayUnlike:"none"})
                return res
            })            
    }
    else{
        let err = new Error('You need to enter all the information')
        err.status = 400
        return next(err)
    }
})

/////////////////////////////////////////////////get /explor

route.get('/explore', (req, res, next) => {
    if (!req.session.userID) {
        return res.redirect('/login')
    }

    Post.find().then((posts) => {

        var arrayOfTodos = [];
        posts.forEach(function(element) {

            User.findById(req.session.userID)
                    .exec((err, user) => {
                        if (err) return next(err)

                        var flag = 0

                        for (var i = 0; i < element.usersWhoLiked.length; i++) {
                            if(element.usersWhoLiked[i].email == user.email){
                                flag = 1
                                var editedElement = {
                                    _id: element._id,
                                    email: element.email,
                                    body: element.body,
                                    totalLikes: element.totalLikes,
                                    timestamp: element.timestamp,
                                    comments: element.comments,
                                    displayLike: "none",
                                    displayUnlike: "inline",
                                    usersWhoLiked: element.usersWhoLiked
                                }
                                console.log(editedElement)
                                arrayOfTodos.push(editedElement);
                                break
                            }
                        }

                        if(flag==0){
                            var editedElement = {
                                _id: element._id,
                                email: element.email,
                                body: element.body,
                                totalLikes: element.totalLikes,
                                timestamp: element.timestamp,
                                comments: element.comments,
                                displayLike: "inline",
                                displayUnlike: "none",
                                usersWhoLiked: element.usersWhoLiked
                            }
                            console.log(editedElement)
                            arrayOfTodos.push(editedElement);
                        }
                    })
        });
        return res.render('explore', { title: 'explore', people: arrayOfTodos })
    })
})

module.exports = route