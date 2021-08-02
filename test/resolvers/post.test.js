import * as post from '../../src/resolvers/post';
import Post from '../../src/models/post';
jest.mock('../../src/models/post');

describe('post.js', () => {
  beforeEach(() => {
    Post.mockClear();
  });

  describe('listRecentPosts', () => {
    it('should instantiate a new post object with the correct options', async () => {
      const options = {
        threadID: 'testThreadID',
        ipAddress: 'testIpAddress',
        name: 'testName',
        subject: 'testSubject',
        sage: true,
        body: 'testBody',
        files: [{ fileID: 'testFileID' }]
      };

      const mockDate = new Date(123456789);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const mock = {
        setThreadID: jest.fn(function (threadID) {
          expect(threadID).toBe(options.threadID);
          return this;
        }),
        setIpAddress: jest.fn(function (ipAddress) {
          expect(ipAddress).toBe(options.ipAddress);
          return this;
        }),
        setCreated: jest.fn(function (created) {
          expect(created).toBe(mockDate.toISOString());
          return this;
        }),
        setBanMessage: jest.fn(function (message) {
          expect(message).toBe('');
          return this;
        }),
        setName: jest.fn(function (name) {
          expect(name).toBe(options.name);
          return this;
        }),
        generateTripcode: jest.fn(function (name) {
          expect(name).toBe(options.name);
          return this;
        }),
        setSubject: jest.fn(function (subject) {
          expect(subject).toBe(options.subject);
          return this;
        }),
        setSage: jest.fn(function (sage) {
          expect(sage).toBe(options.sage);
          return this;
        }),
        renderBody: jest.fn(function (body) {
          expect(body).toBe(options.body);
          return this;
        }),
        setFiles: jest.fn(function (files) {
          expect(files).toBe(options.files);
          return this;
        }),
        save: jest.fn(async function() {
          return this;
        })
      }

      Post.mockImplementation(() => mock);

      // Start the test.
      await post.addPost(options);

      // Verify method calls.
      expect(Post).toHaveBeenCalledTimes(1);
      expect(mock.setThreadID).toHaveBeenCalledTimes(1);
      expect(mock.setIpAddress).toHaveBeenCalledTimes(1);
      expect(mock.setCreated).toHaveBeenCalledTimes(1);
      expect(mock.setBanMessage).toHaveBeenCalledTimes(1);
      expect(mock.setName).toHaveBeenCalledTimes(1);
      expect(mock.generateTripcode).toHaveBeenCalledTimes(1);
      expect(mock.setSubject).toHaveBeenCalledTimes(1);
      expect(mock.setSage).toHaveBeenCalledTimes(1);
      expect(mock.renderBody).toHaveBeenCalledTimes(1);
      expect(mock.setFiles).toHaveBeenCalledTimes(1);
      expect(mock.save).toHaveBeenCalledTimes(1);
    });
  });
  describe('addPost', () => {
    it('should instantiate a new post object with the correct options', async () => {
      const options = {
        threadID: 'testThreadID',
        ipAddress: 'testIpAddress',
        name: 'testName',
        subject: 'testSubject',
        sage: true,
        body: 'testBody',
        files: [{ fileID: 'testFileID' }]
      };

      const mockDate = new Date(123456789);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const mock = {
        setThreadID: jest.fn(function (threadID) {
          expect(threadID).toBe(options.threadID);
          return this;
        }),
        setIpAddress: jest.fn(function (ipAddress) {
          expect(ipAddress).toBe(options.ipAddress);
          return this;
        }),
        setCreated: jest.fn(function (created) {
          expect(created).toBe(mockDate.toISOString());
          return this;
        }),
        setBanMessage: jest.fn(function (message) {
          expect(message).toBe('');
          return this;
        }),
        setName: jest.fn(function (name) {
          expect(name).toBe(options.name);
          return this;
        }),
        generateTripcode: jest.fn(function (name) {
          expect(name).toBe(options.name);
          return this;
        }),
        setSubject: jest.fn(function (subject) {
          expect(subject).toBe(options.subject);
          return this;
        }),
        setSage: jest.fn(function (sage) {
          expect(sage).toBe(options.sage);
          return this;
        }),
        renderBody: jest.fn(function (body) {
          expect(body).toBe(options.body);
          return this;
        }),
        setFiles: jest.fn(function (files) {
          expect(files).toBe(options.files);
          return this;
        }),
        save: jest.fn(async function() {
          return this;
        })
      }

      Post.mockImplementation(() => mock);

      // Start the test.
      await post.addPost(options);

      // Verify method calls.
      expect(Post).toHaveBeenCalledTimes(1);
      expect(mock.setThreadID).toHaveBeenCalledTimes(1);
      expect(mock.setIpAddress).toHaveBeenCalledTimes(1);
      expect(mock.setCreated).toHaveBeenCalledTimes(1);
      expect(mock.setBanMessage).toHaveBeenCalledTimes(1);
      expect(mock.setName).toHaveBeenCalledTimes(1);
      expect(mock.generateTripcode).toHaveBeenCalledTimes(1);
      expect(mock.setSubject).toHaveBeenCalledTimes(1);
      expect(mock.setSage).toHaveBeenCalledTimes(1);
      expect(mock.renderBody).toHaveBeenCalledTimes(1);
      expect(mock.setFiles).toHaveBeenCalledTimes(1);
      expect(mock.save).toHaveBeenCalledTimes(1);
    });

    it('should fall back to defaults if options missing', async () => {
      const options = {
        threadID: 'testThreadID',
        ipAddress: 'testIpAddress',
        // name: 'testName',
        // subject: 'testSubject',
        sage: true,
        // body: 'testBody',
        // files: [{ fileID: 'testFileID' }]
      };

      const mockDate = new Date(123456789);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const mock = {
        setThreadID: jest.fn(function (threadID) {
          expect(threadID).toBe(options.threadID);
          return this;
        }),
        setIpAddress: jest.fn(function (ipAddress) {
          expect(ipAddress).toBe(options.ipAddress);
          return this;
        }),
        setCreated: jest.fn(function (created) {
          expect(created).toBe(mockDate.toISOString());
          return this;
        }),
        setBanMessage: jest.fn(function (message) {
          expect(message).toBe('');
          return this;
        }),
        setName: jest.fn(function (name) {
          expect(name).toBe('Anonymous');
          return this;
        }),
        generateTripcode: jest.fn(function (name) {
          expect(name).toBe('');
          return this;
        }),
        setSubject: jest.fn(function (subject) {
          expect(subject).toBe('');
          return this;
        }),
        setSage: jest.fn(function (sage) {
          expect(sage).toBe(options.sage);
          return this;
        }),
        renderBody: jest.fn(function (body) {
          expect(body).toBe('');
          return this;
        }),
        setFiles: jest.fn(function (files) {
          expect(files).toEqual([]);
          return this;
        }),
        save: jest.fn(async function() {
          return this;
        })
      }

      Post.mockImplementation(() => mock);

      // Start the test.
      await post.addPost(options);

      // Verify method calls.
      expect(Post).toHaveBeenCalledTimes(1);
      expect(mock.setThreadID).toHaveBeenCalledTimes(1);
      expect(mock.setIpAddress).toHaveBeenCalledTimes(1);
      expect(mock.setCreated).toHaveBeenCalledTimes(1);
      expect(mock.setBanMessage).toHaveBeenCalledTimes(1);
      expect(mock.setName).toHaveBeenCalledTimes(1);
      expect(mock.generateTripcode).toHaveBeenCalledTimes(1);
      expect(mock.setSubject).toHaveBeenCalledTimes(1);
      expect(mock.setSage).toHaveBeenCalledTimes(1);
      expect(mock.renderBody).toHaveBeenCalledTimes(1);
      expect(mock.setFiles).toHaveBeenCalledTimes(1);
      expect(mock.save).toHaveBeenCalledTimes(1);
    });
  });
});
