import { fieldsToJsonSchema } from '@segment/actions-core'
import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { createHash } from 'crypto'
import { JSONSchema4 } from 'json-schema'

// Implementation of Facebook user data object
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters

export const user_data_field: InputField = {
  label: 'User Data',
  description: 'These parameters are a set of identifiers Facebook can use for targeted attribution. You must provide at least one of the following user_data keys in your request',
  type: 'object',
  properties: {
    externalId: {
      label: 'External ID',
      description: 'Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.',
      type: 'string',
      multiple: true
    },
    email: {
      label: 'Email',
      description: 'An email address, in lowercase. Example: joe@eg.com',
      type: 'string'
    },
    phone: {
      label: 'Phone',
      description: 'A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code as part of the customer phone number, even if all of the data is from the same country, as the country code is used for matching.',
      type: 'string'
    },
    gender: {
      label: 'Gender',
      description: 'Gender, in lowercase. Either f or m.',
      type: 'string'
    },
    dateOfBirth: {
      label: 'Date of Birth',
      description: 'A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.',
      type: 'string'
    },
    lastName: {
      label: 'Last Name',
      description: 'A last name in lowercase.',
      type: 'string'
    },
    firstName: {
      label: 'First Name',
      description: 'A first name in lowercase.',
      type: 'string'
    },
    city: {
      label: 'City',
      description: 'A city in lower-case without spaces or punctuation. Example: menlopark.',
      type: 'string'
    },
    state: {
      label: 'State',
      description: 'A two-letter state code in lowercase. Example: ca.',
      type: 'string'
    },
    zip: {
      label: 'Zip Code',
      description: 'If you are in the United States, this is a five-digit zip code. For other locations, follow each country`s standards. Example: 94035 (for United States)',
      type: 'string'
    },
    country: {
      label: 'Country',
      description: 'A two-letter country code in lowercase.',
      type: 'string'
    },
    client_ip_address: {
      label: 'Client IP Address',
      description: 'The IP address of the browser corresponding to the event.',
      type: 'string'
    },
    client_user_agent: {
      label: 'Client User Agent',
      description: 'The user agent for the browser corresponding to the event. client_user_agent is required if action_source = “website”; however it is strongly recommended that you include it for any action_source.',
      type: 'string'
    },
    fbc: {
      label: 'Click ID',
      description: 'The Facebook click ID value stored in the _fbc browser cookie under your domain.',
      type: 'string'
    },
    fbp: {
      label: 'Browser ID',
      description: 'The Facebook browser ID value stored in the _fbp browser cookie under your domain.',
      type: 'string'
    },
    subscriptionID: {
      label: 'Subscription ID',
      description: 'The subscription ID for the user in this transaction.',
      type: 'string'
    },
    leadID: {
      label: 'Lead ID',
      description: 'ID associated with a lead generated by Facebook`s Lead Ads.',
      type: 'integer'
    },
    fbLoginID: {
      label: 'Facebook Login ID',
      description: 'ID issued by Facebook when a person first logs into an instance of an app.',
      type: 'integer'
    }
  },
  default: {
    externalId: {
      '@if': {
        exists: { '@path': '$.properties.userId' },
        then: { '@path': '$.properties.userId' },
        else: { '@path': '$.properties.anonymousId' }
      }
    },
    email: {
      '@path': '$.context.traits.email'
    },
    phone: {
      '@path': '$.context.traits.phone'
    },
    dateOfBirth: {
      '@path': '$.context.traits.birthday'
    },
    lastName: {
      '@path': '$.context.traits.lastName'
    },
    firstName: {
      '@path': '$.context.traits.firstName'
    },
    city: {
      '@path': '$.context.traits.address.city'
    },
    state: {
      '@path': '$.context.traits.address.state'
    },
    zip: {
      '@path': '$.context.traits.address.postalCode'
    },
    client_ip_address: {
      '@path': '$.context.ip'
    },
    client_user_agent: {
      '@path': '$.context.userAgent'
    },
    fbc: {
      '@path': '$.properties.fbc'
    },
    fbp: {
      '@path': '$.properties.fbp'
    }
  }
}

const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

const hash_array = (value: (string | undefined)[] | undefined) => {
  if (value === undefined) return

  value.forEach((item, index) => {
    if (item !== undefined) {
      value[index] = hash(item)
    }
  })
}

export const hash_user_data = (user_data: UserData): Object => {
  return {
    em: hash(user_data?.email),
    ph: hash(user_data?.phone),
    ge: hash(user_data?.gender),
    db: hash(user_data?.dateOfBirth),
    ln: hash(user_data?.lastName),
    fn: hash(user_data?.firstName),
    ct: hash(user_data?.city),
    st: hash(user_data?.state),
    zp: hash(user_data?.zip),
    country: hash(user_data?.country),
    external_id: hash_array(user_data?.externalId), // Hashing this is recommended but not required.
    client_ip_address: user_data?.client_ip_address,
    client_user_agent: user_data?.client_user_agent,
    fbc: user_data?.fbc,
    fbp: user_data?.fbp,
    subscription_id: user_data?.subscriptionID,
    lead_id: user_data?.leadID,
    fb_login_id: user_data?.fbLoginID
  }
}

function prepareSchema(fields: Record<string, InputField>): JSONSchema4 {
  let schema = fieldsToJsonSchema(fields, { tsType: true })
  // Remove extra properties so it produces cleaner output
  schema = removeExtra(schema)
  return schema
}

function removeExtra(schema: JSONSchema4) {
  const copy = { ...schema }

  delete copy.title
  delete copy.enum

  if (copy.type === 'object' && copy.properties) {
    for (const [key, property] of Object.entries(copy.properties)) {
      copy.properties[key] = removeExtra(property)
    }
  } else if (copy.type === 'array' && copy.items) {
    copy.items = removeExtra(copy.items)
  }

  return copy
}

export const test_schema = prepareSchema({user_data: user_data_field})

// Copy of the user_data subfield in the generated-types
interface UserData {
  /**
   * Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.
   */
  externalId?: string[]
  /**
   * An email address, in lowercase. Example: joe@eg.com
   */
  email?: string
  /**
   * A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code as part of the customer phone number, even if all of the data is from the same country, as the country code is used for matching.
   */
  phone?: string
  /**
   * Gender, in lowercase. Either f or m.
   */
  gender?: string
  /**
   * A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.
   */
  dateOfBirth?: string
  /**
   * A last name in lowercase.
   */
  lastName?: string
  /**
   * A first name in lowercase.
   */
  firstName?: string
  /**
   * A city in lower-case without spaces or punctuation. Example: menlopark.
   */
  city?: string
  /**
   * A two-letter state code in lowercase. Example: ca.
   */
  state?: string
  /**
   * If you are in the United States, this is a five-digit zip code. For other locations, follow each country`s standards. Example: 94035 (for United States)
   */
  zip?: string
  /**
   * A two-letter country code in lowercase.
   */
  country?: string
  /**
   * The IP address of the browser corresponding to the event.
   */
  client_ip_address?: string
  /**
   * The user agent for the browser corresponding to the event. client_user_agent is required if action_source = “website”; however it is strongly recommended that you include it for any action_source.
   */
  client_user_agent?: string
  /**
   * The Facebook click ID value stored in the _fbc browser cookie under your domain.
   */
  fbc?: string
  /**
   * The Facebook browser ID value stored in the _fbp browser cookie under your domain.
   */
  fbp?: string
  /**
   * The subscription ID for the user in this transaction.
   */
  subscriptionID?: string
  /**
   * ID associated with a lead generated by Facebook`s Lead Ads.
   */
  leadID?: number
  /**
   * ID issued by Facebook when a person first logs into an instance of an app.
   */
  fbLoginID?: number
}