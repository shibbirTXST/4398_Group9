module.exports = {
  PrismaClient: jest.fn().mockImplementation(() => ({})),
  Prisma: {},
};