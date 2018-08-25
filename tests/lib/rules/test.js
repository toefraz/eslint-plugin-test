/**
 * @fileoverview dg
 * @author Tommy
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require('../../../lib/rules/test'),
    RuleTester = require('eslint').RuleTester;

RuleTester.setDefaultConfig({
    parserOptions: {
        ecmaVersion: 6
    }
});

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const goodCode = `
const express = require('express');
const router = express.Router();
const keywordClient = require('../../keywordClient');

router.post('/blah/keyword/asdad', blah.inAnyGroup(asd), doSomething);
function doSomething(req, res, next) {
    db.blah.find()
        .then(()=> {
            return keywordClient(blah).postAsync('/first/blah/blah/end', parameters);
        });
}
`;

const doesntUsePost = `
const express = require('express');
const router = express.Router();
const keywordClient = require('../../keywordClient');

router.post('/blah/keyword/asdad', blah.inAnyGroup(asd), doSomething);
function doSomething(req, res, next) {
    db.blah.find()
        .then(()=> {
            return keywordClient(blah).getAsync('/first/blah/blah/end', parameters);
        });
}
`;

const noPostRoute = `
const express = require('express');
const router = express.Router();
const keywordClient = require('../../keywordClient');

router.get('/blah/keyword/asdad', blah.inAnyGroup(asd), doSomething);
function doSomething(req, res, next) {
    db.blah.find()
        .then(()=> {
            return keywordClient(blah).postAsync('/first/blah/blah/end', parameters);
        });
}
`;

const noAnyGroup = `
const express = require('express');
const router = express.Router();
const keywordClient = require('../../keywordClient');

router.post('/blah/keyword/asdad', blah.inAGroup(asd), doSomething);
function doSomething(req, res, next) {
    db.blah.find()
        .then(()=> {
            return keywordClient(blah).postAsync('/first/blah/blah/end', parameters);
        });
}
`;

var ruleTester = new RuleTester();
ruleTester.run('test', rule, {
    valid: [
        {
            code: goodCode
        }
    ],

    invalid: [
        {
            code: doesntUsePost,
            errors: [
                {
                    message: 'Keyword call must use POST.',
                    type: 'CallExpression'
                }
            ]
        },
        {
            code: noPostRoute,
            errors: [
                {
                    message: 'This route contains a call to Keyword and should be a POST.',
                    type: 'CallExpression'
                }
            ]
        },
        {
            code: noAnyGroup,
            errors: [
                {
                    message: 'This route should be behind some permission check.',
                    type: 'CallExpression'
                }
            ]
        }
    ]
});
