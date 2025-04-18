const gb = require('glov-build');
const spritesheet = require('./spritesheet.js');
const yamlproc = require('./yamlproc.js');

function copy(job, done) {
  job.out(job.getFile());
  done();
}

module.exports = function (config) {
  // Spine support
  // Note: Runtime requires a Spine license to use in any product.
  config.client_fsdata.push(
    'client/spine/**.atlas',
    'client/spine/**.skel',
    'client/spine/**.json',
  );

  config.client_static.push('client_json:client/levels/*.json');

  gb.task({
    name: 'walldefs',
    input: ['client/walls/**/*.walldef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('walldefs');
  config.client_fsdata.push('walldefs:**');
  config.server_fsdata.push('walldefs:**');
  config.fsdata_embed.push('.walldef');

  gb.task({
    name: 'celldefs',
    input: ['client/cells/**/*.celldef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('celldefs');
  config.client_fsdata.push('celldefs:**');
  config.server_fsdata.push('celldefs:**');
  config.fsdata_embed.push('.celldef');

  gb.task({
    name: 'entdefs',
    input: ['client/entities/**/*.entdef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('entdefs');
  config.client_fsdata.push('entdefs:**');
  config.server_fsdata.push('entdefs:**');
  config.fsdata_embed.push('.entdef');

  gb.task({
    name: 'vstyles',
    input: ['client/vstyles/**/*.vstyle'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('vstyles');
  config.client_fsdata.push('vstyles:**');
  config.server_fsdata.push('vstyles:**');
  config.fsdata_embed.push('.vstyle');
  let client_spritesheets = [];
  [
    'crawlertest',
    'whitebox',
    'ship2',
    'ship3',
    'icons',
    'faces',
    'solitude',
    'enemies',
    'forest',
    'ruins',
    'cosmic',
  ].forEach((name) => {
    gb.task({
      name: `client_sprites_${name}`,
      input: `textures/spritesheets/${name}/*.png`,
      ...spritesheet({
        name: name,
        pad: 8,
        //tile_horiz_regex: /wall|door|exit/,
        clamp_regex: /./,
      }),
    });
    config.client_js_files.push(`client_sprites_${name}:**/*.js`);
    client_spritesheets.push(`client_sprites_${name}:**/*.png`);
  });

  gb.task({
    type: gb.SINGLE,
    name: 'client_spritesheets',
    input: client_spritesheets,
    func: copy,
  });
  config.client_png.push('client_spritesheets:**');
  //config.extra_client_tasks.push('client_spritesheets');

  config.extra_index = [{
    name: 'itch',
    defines: {
      ...config.default_defines,
      PLATFORM: 'web',
    },
    zip: true,
  }];

};
