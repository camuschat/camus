How to contribute to Camus
==========================

Thanks for taking the time to read this document and for your interest in
contributing! There are lots of ways to contribute, whether it's reporting
a bug, writing code, or helping someone solve a problem. Please read the
relevant section of this document before posting in the discussions,
opening an issue, or submitting a pull request.

Some ideas for contributing
---------------------------

Are you a user of Camus?
~~~~~~~~~~~~~~~~~~~~~~~~

Good news, you don't have to be a programmer to contribute!

- If you've found a bug or something isn't working as expected, you can
  `open an issue`_
- If you have ideas for improvements or new features, you can post in the
  `Discussions`_ area
- If you want to help others use Camus, or need help yourself, you can answer
  or ask questions in the `Discussions`_ area
- You can show people how you're using Camus by writing a blog post, making a
  video, or telling your friends

Do you know TypeScript, React, or CSS?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The frontend could use improvements, including:

- Better `accessibility`_
- Support for `internationalization`_ & `localization`_
- Styling improvements
- New user-facing features

Do you know Python, Flask, or other backend technologies?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The backend needs work, for example:

- Support horizontal scaling to multiple instances
- New features, like user accounts and integration with other services

Are you an ops person or sysadmin?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Why not help make it easy for anyone to deploy their own Camus server?

- Add packaging for a new platform (`Arch`_, `Homebrew`_, `Flatpak`_, etc.)
- Write deployment tooling (e.g. `Terraform Camus`_)
- Write a `tutorial`_

Participating in discussions
----------------------------

`Discussions`_ is a space where users and contributors are welcome to interact,
including things like asking/answering questions, discussing ideas for
improvements or new features, providing feedback about the project, telling
us how you're using Camus, etc. Feel free to post about anything related to
Camus here, but please keep the following in mind:

- Be respectful in your interactions with others, and treat everyone as a human
  first.
- It's OK to disagree, but be constructive if offering criticism. Don't simply
  point out a problem with someone's idea without offering your own ideas for
  a solution.
- Harassment and personal attacks cannot be tolerated and should be `reported`_
  to the project maintainer. Everyone is welcome to contribute regardless of
  race, gender, ethnicity, religion, disability, sexual orientation, personal
  appearance, or skill level.

Opening an issue
----------------

If you have a bug to report or something is not working as expected, please
`open an issue`_. General discussion and questions are better suited to the
Discussions area.

Before opening a new issue, search the `existing issues`_ and `Discussions`_ to
see if someone else has run into a similar problem. If an issue or discussion
thread already exists that addresses your problem, post there rather than
opening a new issue.

When opening an issue, please be as specific as possible. For bug reports,
include all relevant information such as your operating system, browser vendor
and version, how to reproduce the problem, and (if possible) error messages or
logs.

Opening a pull request
----------------------

If you wish to submit a `pull request`_, please open an issue first to discuss
the changes you want to make.

Next, read the documentation on `architecture`_ and `development`_.

When implementing your changes:

- Ensure that the style and formatting of your code conforms to the existing
  code. Use a linter (`ESLint`_ for TypeScript or `Pylint`_ for Python) to
  catch common issues and use `Prettier`_ to format TypeScript code.
- Add or update tests as needed
- Run the tests and make sure that they pass
- Add or update documentation as needed

When opening your pull request:

- Write a description of your changes
- Rebase your branch on ``master`` and squash your commits to a minimal number
- Ensure that the automated checks pass and make updates to your PR as needed
- Wait for a review from the project maintainer and make further changes as
  requested

Don't be afraid to ask for help or make suggestions!
----------------------------------------------------

Software is a perpetual work-in-progress, and we're all constantly learning new
things as tools, languages, and code evolve. So long as we treat one another
with respect, together we can make progress and build something useful.


.. _open an issue: https://github.com/camuschat/camus/issues
.. _accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility
.. _internationalization: https://developer.mozilla.org/en-US/docs/Glossary/Internationalization_and_localization
.. _localization: https://developer.mozilla.org/en-US/docs/Glossary/Localization
.. _Arch: https://wiki.archlinux.org/index.php/Arch_package_guidelines
.. _Homebrew: https://brew.sh/
.. _Flatpak: https://www.flatpak.org/
.. _Terraform Camus: https://github.com/camuschat/terraform-camus
.. _tutorial: https://docs.camus.chat/en/latest/tutorials/index.html
.. _Discussions: https://github.com/camuschat/camus/discussions
.. _reported: mailto:mrgnr@pm.me
.. _existing issues: https://github.com/camuschat/camus/issues?q=is%3Aissue
.. _pull request: https://github.com/camuschat/camus/pulls
.. _architecture: https://docs.camus.chat/en/latest/architecture.html
.. _development: https://docs.camus.chat/en/latest/development.html
.. _ESLint: https://eslint.org/
.. _Pylint: https://pylint.org/
.. _Prettier: https://prettier.io/
