/**
 * @fileoverview dg
 * @author Tommy
 */
"use strict";
const _ = require('lodash');
const esquery = require('esquery');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "dg",
            category: "Fill me in",
            recommended: false
        },
        fixable: null,  // or "code" or "whitespace"
        schema: [
            // fill in your schema
        ]
    },

    create: function(context) {
        function getRouteVarName(root) {
            const expressMatches = esquery(root, 'CallExpression[callee.name=require][arguments.0.value=express]');

            if (expressMatches.length === 1) {
                const expressName = expressMatches[0].parent.id.name;
                const routerMatches = esquery(root, `CallExpression[callee.object.name="${expressName}"][callee.property.name=Router]`);
                
                if (routerMatches.length === 1) {
                    const routerName = routerMatches[0].parent.id.name;
                    return routerName;
                }
            }
        }

        function findRoutes(root, routerName, fnName) {
            const routes = esquery(root, `CallExpression[callee.object.name="${routerName}"]`)
            const fnRoutes = routes.filter((route) => {
                return route.arguments[route.arguments.length - 1].name === fnName;
            });

            return fnRoutes;
        }

        return {

            'CallExpression[callee.name=require][arguments.0.value=/keywordClient/]': (node) => {
                const variableName = node.parent.id.name;

                if (variableName !== 'keywordClient') {
                    return context.report({
                        node: node.parent,
                        message: 'KeywordClient import must be named "keywordClient".'
                    })
                }
            },

            'CallExpression[callee.object.callee.name=keywordClient][arguments.0.value=/^\\u002Ffirst\\u002F.*\\u002Fend$/]': (node) => {
                const ancestors = context.getAncestors();
                const root = ancestors[0];
                const fnName = ancestors[1].id.name;
                const property = node.callee.property.name;

                if (property.slice(0, 4) !== 'post') {
                    return context.report({
                        node: node,
                        message: 'Keyword call must use POST.'
                    })
                }

                const routerName = getRouteVarName(root);
                const routes = findRoutes(root, routerName, fnName);

                if (routes.length === 0) {
                    return;
                }

                const nonPostRoutes = routes.filter((route) => {
                    return route.callee.property.name !== 'post';
                });

                if (nonPostRoutes.length) {
                    return routes.forEach((route) => {
                        context.report({
                            node: route,
                            message: 'This route contains a call to Keyword and should be a POST.'
                        })
                    });
                }

                return routes.forEach((route) => {
                    const args = route.arguments.slice(1, -1);
                    const hasPermission = _.some(args, (arg) => {
                        return _.get(arg, 'callee.property.name') === 'inAnyGroup'
                    });
                   
                    if (route.arguments.length < 3 || !hasPermission) {
                        return context.report({
                            node: route,
                            message: 'This route should be behind some permission check.'
                        });
                    }
                });
            }

        };
    }
};
