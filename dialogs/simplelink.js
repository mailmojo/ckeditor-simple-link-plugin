(function (CKEDITOR) {
  'use strict';

  /**
   * Simple check if an URL contains a scheme.
   *
   * @param {String} url
   * @return {Boolean}
   */
  function containsScheme(url) {
    return /^[A-Z]+:/i.test(url);
  }

  /**
   * Simple check if a string is an email address.
   *
   * Based on the simple regexp given on:
   * http://www.regular-expressions.info/email.html
   *
   * Expanded to also include characters from the latter half of the Unicode
   * Latin-1 supplement. The first half of this set is mostly non-printable
   * characters or irrelevant email address characters. The latter half contains
   * characters found in many Western European languages.
   *
   * @param {String} str
   * @return {Boolean}
   */
  function isEmail(str) {
    return /^[A-Z0-9\u00C0-\u00FF._%+-]+@[A-Z0-9\u00C0-\u00FF.-]+\.[A-Z]{2,}$/i.test(
      str
    );
  }

  /**
   * Validate the URL's domain.
   *
   * @param {String} str
   */
  function isValidDomain(str) {
    if (!URL.canParse(str)) {
      return false;
    }

    const url = new URL(str);
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}$/i;
    return domainRegex.test(url.hostname);
  }

  CKEDITOR.dialog.add('simplelinkDialog', function (editor) {
    return {
      allowedContent: 'a[href,target]',
      title: editor.lang.simplelink.title,
      minWidth: 400,
      minHeight: 100,
      resizable: CKEDITOR.DIALOG_RESIZE_NONE,
      contents: [
        {
          id: 'SimpleLink',
          label: 'SimpleLink',
          elements: [
            {
              type: 'text',
              label: editor.lang.simplelink.urlLabel,
              id: 'edp-URL',
              validate: function () {
                const emptyMsg = CKEDITOR.dialog.validate
                  .notEmpty(editor.lang.simplelink.missingUrl)
                  .apply(this);

                if (emptyMsg !== true) {
                  return emptyMsg;
                }
                console.log(this.getValue());
                if (!isValidDomain(this.getValue())) {
                  return editor.lang.simplelink.invalidUrl;
                }

                return true;
              },

              /**
               * Get the `href` attribute from the link being edited and make sure it has a
               * scheme.
               *
               * @param {CKEDITOR.dom.element} element Currently selected element.
               */
              setup: function (element) {
                var href = CKEDITOR.tools.trim(element.getAttribute('href'));

                if (href) {
                  if (!containsScheme(href) && !isEmail(href)) {
                    href = 'https://' + href;
                  } else if (href.substr(0, 7) === 'mailto:') {
                    href = href.substr(7);
                  }

                  this.setValue(href);
                }

                if (!!element.$.dataset.hrefReadonly) {
                  this.disable();
                  this.getInputElement().setAttribute(
                    'title',
                    editor.lang.simplelink.urlReadonly
                  );
                }
              },

              /**
               * Update selected element with new `href` value from dialog input.
               *
               * Also sets text content for link to the URL if no text value exists
               * already.
               *
               * @param {CKEDITOR.dom.element} element Currently selected element.
               */
              commit: function (element) {
                var href = CKEDITOR.tools.trim(this.getValue());

                if (href) {
                  if (!containsScheme(href)) {
                    if (isEmail(href)) {
                      href = 'mailto:' + href;
                    } else {
                      href = 'http://' + href;
                    }
                  }

                  element.setAttribute('href', href);

                  if (!element.getText()) {
                    element.setText(this.getValue());
                  }
                }
              },
            },
            {
              type: 'text',
              label: editor.lang.simplelink.displayTextLabel,
              id: 'edp-text-display',

              /**
               * Set input value to text content of currently selected element.
               *
               * @param {CKEDITOR.dom.element} element Currently selected element.
               */
              setup: function (element) {
                var text = element.getText().replace(/^\s+|\s+$/, '');
                this.setValue(text);
              },

              /**
               * Update link text content with input value if non-empty.
               *
               * @param {CKEDITOR.dom.element} element Currently selected element.
               */
              commit: function (element) {
                var currentValue = this.getValue();

                if (currentValue !== '' && currentValue !== null) {
                  element.setText(currentValue);
                }
              },
            },
          ],
        },
      ],

      onShow: function () {
        var selection = editor.getSelection();
        var selector = selection.getStartElement();
        var element;

        if (selector) {
          element = selector.getAscendant('a', true);
        }

        if (!element || element.getName() != 'a') {
          element = editor.document.createElement('a');
          element.setAttribute('target', '_blank');

          if (selection) {
            element.setText(selection.getSelectedText());
          }

          this.insertMode = true;
        } else {
          this.insertMode = false;
        }

        this.element = element;

        this.setupContent(this.element);
      },

      onOk: function () {
        this.commitContent(this.element);

        if (this.insertMode) {
          editor.insertElement(this.element);
        }
      },
    };
  });
})(window.CKEDITOR);
