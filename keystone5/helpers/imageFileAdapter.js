/* eslint-disable require-jsdoc */
const sharp = require('sharp');
const {save, remove} = require('./aws');

module.exports = class S3Adapter {
  constructor({folder, getFilename, publicUrl}) {
    this.folder = folder || 'misc';
    if (getFilename) {
      this.getFilename = getFilename;
    }
    if (publicUrl) {
      this.publicUrl = publicUrl;
    }
  }

  async save({stream, filename, id, encoding}) {
    const uniqueFilename = this.getFilename({id, originalFilename: filename});
    const mimetype = 'image/webp';
    const thumb = await new Promise((resolve, reject) => {
      const buffers = [];
      const output = stream.pipe(sharp().resize(400, 400).webp({quality: 100}));
      output.on('data', (chunk) => buffers.push(Buffer.from(chunk)));
      output.on('error', (err) => reject(err));
      output.on('end', () => resolve(Buffer.concat(buffers)));
    });
    stream.destroy();
    const data = await save(uniqueFilename, this.folder, mimetype, thumb);
    return {
      id,
      originalFilename: filename,
      filename: data.Location,
      mimetype,
      encoding,
      _meta: data,
    };
  }

  async delete(file, options = {}) {
    if (file) {
      return remove(file.filename, this.folder, options);
    }
    return Promise.reject(new Error('Missing required argument `file`.'));
  }

  getFilename({id}) {
    return `${id}.webp`;
  }

  publicUrl({filename}) {
    return `/${this.folder}/${filename}`;
  }
};
