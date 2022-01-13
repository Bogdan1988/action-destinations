import nock from 'nock'
import createRequestClient from '../../../../../core/src/create-request-client'
import Salesforce from '../sf-operations'

const API_VERSION = 'v53.0'

const settings = {
  instanceUrl: 'https://test.com'
}

const requestClient = createRequestClient()

describe('Salesforce', () => {
  describe('Operations', () => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, requestClient)

    it('should lookup based on a single trait', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Lead WHERE email = 'sponge@seamail.com'`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          traits: {
            email: 'sponge@seamail.com'
          }
        },
        'Lead'
      )
    })

    it('should lookup based on multiple traits', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Lead WHERE email = 'sponge@seamail.com' OR company = 'Krusty Krab'`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      await sf.updateRecord(
        {
          traits: {
            email: 'sponge@seamail.com',
            company: 'Krusty Krab'
          }
        },
        'Lead'
      )
    })

    it('should fail when a record is not found', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Lead WHERE email = 'sponge@seamail.com'`)
        .reply(201, {
          totalSize: 0
        })

      await expect(
        sf.updateRecord(
          {
            traits: {
              email: 'sponge@seamail.com'
            }
          },
          'Lead'
        )
      ).rejects.toThrowError('No record found with given traits')
    })

    it('should fail when multiple records are found', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Lead WHERE email = 'sponge@seamail.com'`)
        .reply(201, {
          totalSize: 15
        })

      await expect(
        sf.updateRecord(
          {
            traits: {
              email: 'sponge@seamail.com'
            }
          },
          'Lead'
        )
      ).rejects.toThrowError('Multiple records returned with given traits')
    })
  })
})