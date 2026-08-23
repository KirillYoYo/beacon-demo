import { faker } from '@faker-js/faker';

export const createPerson = () => {
  const person = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    fullName: faker.person.fullName(),
    gender: faker.person.sex(), // "male" | "female"
    birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }), // возраст 18–65
    email: faker.internet.email(),
    phone: faker.phone.number(),
    avatar: faker.image.avatar(),
  };

  return person;
};
