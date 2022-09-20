const Jasmine = require('jasmine');
const jasmine = new Jasmine();

const addMatchers = () => {
  jasmine.addMatchers(customMatchers);
};

const customMatchers = {
  isSchema: function(matchersUtil) {
    return {
      compare: function(schema) {
        let result = {};
  
        result.pass = !!schema;
  
        if (result.pass) {
          result.message = `Schema exists`;
        } else {
          result.message = `Schema does not exist`;
        }

        return result;
      },
    };
  },
  hasFields: function(matchersUtil) {
    return {
      compare: function(schema, fields) {
        if (fields === undefined) {
          fields = [];
        }
  
        let result = {};
  
        result.pass = fields.every((f) => f in schema.fields);
  
        if (result.pass) {
          result.message = `All fields present`;
        } else {
          result.message = `Expected field missing`;
        }
  
        return result;
      },
    };
  },
  isCorrectType: function(matchersUtil) {
    return {
      compare: function(schema, fieldType, fields) {
        if (fields === undefined) {
          fields = [];
        }
    
        let result = {};
        let badList = [];

        result.pass = fields.every((f) => {
          if(Array.isArray(schema.fields) && !schema.fields.includes(f)) {
            badList.push(f);
          }

          if (typeof schema.fields === 'object' && schema.fields !== null && schema.fields[f].type !== fieldType) {
            badList.push(f);
          }
          return true;
        });

        if(badList.length > 0) {
          result.pass = false;
        }

        if (result.pass) {
          result.message = `All fields are of type ${fieldType.type}`;
        } else {
          result.message = `The following fields are the incorrect type: ${badList.join(', ')}`;
        }

        return result;
      },
    };
  },
};

module.exports = {
  addMatchers,
};
