const isEmpty = require('lodash.isempty');
const castArray = require('lodash.castarray');
const compact = require('lodash.compact');
const util = require('util');

module.exports = (options) => {
  if (isEmpty(options.fields) || isEmpty(options.identifiers)) {
    throw new Error('Fields and identifiers options must be defined.');
  }

  // eslint-disable-next-line no-param-reassign
  options = {
    identifiers: ['id'],
    ...options,
  };

  return (Model) => class extends Model {
    $beforeInsert(context) {
      const parent = super.$beforeInsert(context);

      return this.queryResolver(parent);
    }

    $beforeUpdate(queryOptions, context) {
      const parent = super.$beforeUpdate(queryOptions, context);

      if (isEmpty(queryOptions.old)) {
        throw new Error('Unique validation at update only works with queries started with $query.');
      }

      return this.queryResolver(parent, true, queryOptions);
    }

    queryResolver(parent, update = false, queryOptions = {}) {
      return Promise.resolve(parent)
        .then(() => Promise.all(this.getQuery(update, queryOptions)))
        .then((rows) => {
          const errors = this.parseErrors(rows);

          if (!isEmpty(errors)) {
            throw Model.createValidationError({
              data: errors,
              message: 'Unique Validation Failed',
              type: 'ModelValidation',
            });
          }
        });
    }

    getQuery(update, queryOptions) {
      return options.fields.reduce((queries, field, index) => {
        const knex = Model.knex();
        const collection = knex(this.constructor.tableName);
        const fields = castArray(field);

        if (isEmpty(compact(fields.map((fieldName) => this[fieldName])))) {
          return queries;
        }

        const query = fields
          .reduce(
            (subset, fieldName) => subset.where(fieldName, this[fieldName] || queryOptions.old[fieldName]),
            collection.select(),
          )
          .limit(1);

        if (update) {
          options.identifiers.forEach((identifier) => query.andWhereNot(identifier, queryOptions.old[identifier]));
        }

        // eslint-disable-next-line no-param-reassign
        queries[index] = query;

        return queries;
      }, []);
    }

    // eslint-disable-next-line class-methods-use-this
    parseErrors(rows) {
      return rows.reduce((errors, error, index) => {
        if (!isEmpty(error)) {
          const fields = castArray(options.fields[index]);

          fields.forEach((field) => {
            // eslint-disable-next-line no-param-reassign
            errors[[field]] = [
              {
                keyword: 'unique',
                message: util.format('%s already in use.', options.fields[index]),
              },
            ];
          });
        }

        return errors;
      }, {});
    }
  };
};
