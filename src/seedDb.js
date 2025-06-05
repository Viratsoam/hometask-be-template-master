const { Profile, Contract, Job } = require('./model');

async function seedDatabase() {
  try {
    // Clear existing data
    await Job.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Profile.destroy({ where: {} });

    // Create profiles
    const profiles = await Profile.bulkCreate([
      {
        firstName: 'Harry',
        lastName: 'Potter',
        profession: 'Wizard',
        balance: 1150,
        type: 'client'
      },
      {
        firstName: 'Mr',
        lastName: 'Robot',
        profession: 'Hacker',
        balance: 231.11,
        type: 'client'
      },
      {
        firstName: 'John',
        lastName: 'Snow',
        profession: 'Programmer',
        balance: 451.3,
        type: 'contractor'
      },
      {
        firstName: 'Ash',
        lastName: 'Ketchum',
        profession: 'Pokemon Trainer',
        balance: 1.3,
        type: 'contractor'
      },
      {
        firstName: 'John',
        lastName: 'Lenon',
        profession: 'Musician',
        balance: 64,
        type: 'contractor'
      },
      {
        firstName: 'Linus',
        lastName: 'Torvalds',
        profession: 'Programmer',
        balance: 1214,
        type: 'contractor'
      },
      {
        firstName: 'Alan',
        lastName: 'Turing',
        profession: 'Programmer',
        balance: 22,
        type: 'contractor'
      },
      {
        firstName: 'Aragorn',
        lastName: 'II Elessar Telcontarvalds',
        profession: 'Fighter',
        balance: 314,
        type: 'client'
      }
    ]);

    // Create contracts
    const contracts = await Contract.bulkCreate([
      {
        terms: 'bla bla bla',
        status: 'terminated',
        ClientId: profiles[0].id,
        ContractorId: profiles[2].id
      },
      {
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: profiles[0].id,
        ContractorId: profiles[3].id
      },
      {
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: profiles[1].id,
        ContractorId: profiles[4].id
      },
      {
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: profiles[7].id,
        ContractorId: profiles[5].id
      },
      {
        terms: 'bla bla bla',
        status: 'new',
        ClientId: profiles[7].id,
        ContractorId: profiles[6].id
      }
    ]);

    // Create jobs
    await Job.bulkCreate([
      {
        description: 'work',
        price: 200,
        paid: true,
        paymentDate: '2020-08-15T19:11:26.737Z',
        ContractId: contracts[0].id
      },
      {
        description: 'work',
        price: 201,
        paid: true,
        paymentDate: '2020-08-15T19:11:26.737Z',
        ContractId: contracts[1].id
      },
      {
        description: 'work',
        price: 202,
        paid: true,
        paymentDate: '2020-08-16T19:11:26.737Z',
        ContractId: contracts[2].id
      },
      {
        description: 'work',
        price: 200,
        paid: true,
        paymentDate: '2020-08-17T19:11:26.737Z',
        ContractId: contracts[3].id
      },
      {
        description: 'work',
        price: 200,
        paid: true,
        paymentDate: '2020-08-18T19:11:26.737Z',
        ContractId: contracts[4].id
      },
      {
        description: 'work',
        price: 2020,
        paid: true,
        paymentDate: '2020-08-19T19:11:26.737Z',
        ContractId: contracts[1].id
      },
      {
        description: 'work',
        price: 200,
        paid: false,
        ContractId: contracts[2].id
      },
      {
        description: 'work',
        price: 200,
        paid: false,
        ContractId: contracts[3].id
      },
      {
        description: 'work',
        price: 200,
        paid: false,
        ContractId: contracts[4].id
      }
    ]);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

module.exports = seedDatabase; 