import { stringify as stringifyQuery } from 'querystring';
import fetch from 'node-fetch';
import debugFactory from 'debug';
import promptEmail from 'email-prompt';
import ms from 'ms';
import { validate as validateEmail } from 'email-validator';
import chalk from 'chalk';
import mri from 'mri';
import ua from '../util/ua.ts';
import error from '../util/output/error';
import aborted from '../util/output/aborted';
import wait from '../util/output/wait';
import highlight from '../util/output/highlight';
import info from '../util/output/info';
import ok from '../util/output/ok';
import cmd from '../util/output/cmd.ts';
import ready from '../util/output/ready';
import param from '../util/output/param.ts';
import eraseLines from '../util/output/erase-lines';
import sleep from '../util/sleep';
import { writeToAuthConfigFile, writeToConfigFile } from '../util/config/files';
import getNowDir from '../util/config/global-path';
import hp from '../util/humanize-path';
import logo from '../util/output/logo';
import exit from '../util/exit';
import executeLogin from '../util/login/login.ts'

const debug = debugFactory('now:sh:login');

const help = () => {
  console.log(`
  ${chalk.bold(`${logo} now login`)} <email>

  ${chalk.dim('Options:')}

    -h, --help                     Output usage information
    -A ${chalk.bold.underline('FILE')}, --local-config=${chalk.bold.underline(
    'FILE'
  )}   Path to the local ${'`now.json`'} file
    -Q ${chalk.bold.underline('DIR')}, --global-config=${chalk.bold.underline(
    'DIR'
  )}    Path to the global ${'`.now`'} directory

  ${chalk.dim('Examples:')}

  ${chalk.gray('–')} Log into the Now platform

    ${chalk.cyan('$ now login')}

  ${chalk.gray('–')} Log in using a specific email address

    ${chalk.cyan('$ now login john@doe.com')}
`);
};

const verify = async ({ apiUrl, email, verificationToken }) => {
  const query = {
    email,
    token: verificationToken
  };

  debug('GET /now/registration/verify');

  let res;

  try {
    res = await fetch(
      `${apiUrl}/now/registration/verify?${stringifyQuery(query)}`,
      {
        headers: { 'User-Agent': ua }
      }
    );
  } catch (err) {
    debug(`error fetching /now/registration/verify: $O`, err.stack);

    throw new Error(
      error(
        `An unexpected error occurred while trying to verify your login: ${err.message}`
      )
    );
  }

  debug('parsing response from GET /now/registration/verify');
  let body;

  try {
    body = await res.json();
  } catch (err) {
    debug(
      `error parsing the response from /now/registration/verify: $O`,
      err.stack
    );
    throw new Error(
      error(
        `An unexpected error occurred while trying to verify your login: ${err.message}`
      )
    );
  }

  return body.token;
};

const readEmail = async () => {
  let email;

  try {
    email = await promptEmail({ start: info('Enter your email: ') });
  } catch (err) {
    console.log(); // \n

    if (err.message === 'User abort') {
      throw new Error(aborted('No changes made.'));
    }

    if (err.message === 'stdin lacks setRawMode support') {
      throw new Error(
        error(
          `Interactive mode not supported – please run ${cmd(
            'now login you@domain.com'
          )}`
        )
      );
    }
  }

  console.log(); // \n
  return email;
};

const login = async ctx => {
  const argv = mri(ctx.argv.slice(2), {
    boolean: ['help'],
    alias: {
      help: 'h'
    }
  });

  if (argv.help) {
    help();
    await exit(0);
  }

  argv._ = argv._.slice(1);

  const apiUrl = ctx.apiUrl;
  let email;
  let emailIsValid = false;
  let stopSpinner;

  const possibleAddress = argv._[0];

  // if the last arg is not the command itself, then maybe it's an email
  if (possibleAddress) {
    if (!validateEmail(possibleAddress)) {
      // if it's not a valid email, let's just error
      console.log(error(`Invalid email: ${param(possibleAddress)}.`));
      return 1;
    }

    // valid email, no need to prompt the user
    email = possibleAddress;
  } else {
    do {
      try {
        email = await readEmail();
      } catch (err) {
        let erase = '';
        if (err.message.includes('Aborted')) {
          // no need to keep the prompt if the user `ctrl+c`ed
          erase = eraseLines(2);
        }
        console.log(erase + err.message);
        return 1;
      }
      emailIsValid = validateEmail(email);
      if (!emailIsValid) {
        // let's erase the `> Enter email [...]`
        // we can't use `console.log()` because it appends a `\n`
        // we need this check because `email-prompt` doesn't print
        // anything if there's no TTY
        process.stdout.write(eraseLines(2));
      }
    } while (!emailIsValid);
  }

  let verificationToken;
  let securityCode;

  stopSpinner = wait('Sending you an email');

  try {
    const data = await executeLogin(apiUrl, email);
    verificationToken = data.token;
    securityCode = data.securityCode;
  } catch (err) {
    stopSpinner();
    console.log(error(err.message))
    return 1;
  }

  stopSpinner();

  // Clear up `Sending email` success message
  process.stdout.write(eraseLines(possibleAddress ? 1 : 2));

  console.log(
    info(
      `We sent an email to ${highlight(
        email
      )}. Please follow the steps provided`,
      `  inside it and make sure the security code matches ${highlight(
        securityCode
      )}.`
    )
  );

  stopSpinner = wait('Waiting for your confirmation');

  let token;

  while (!token) {
    try {
      await sleep(ms('1s'));
      token = await verify({ apiUrl, email, verificationToken });
    } catch (err) {
      if (/invalid json response body/.test(err.message)) {
        // /now/registraton is currently returning plain text in that case
        // we just wait for the user to click on the link
      } else {
        stopSpinner();
        console.log(err.message);
        return 1;
      }
    }
  }

  stopSpinner();
  console.log(ok('Email confirmed'));

  // There's no need to save the user since we always
  // pull the user data fresh from the server.
  ctx.authConfig.token = token;

  // New user, so we can't keep the team
  delete ctx.config.currentTeam;

  writeToAuthConfigFile(ctx.authConfig);
  writeToConfigFile(ctx.config);

  console.log(
    ready(
      `Authentication token and personal details saved in ${param(
        hp(getNowDir())
      )}`
    )
  );

  return ctx;
};

export default login;
