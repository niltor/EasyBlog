class Docs {
  docName = '';
  language = 'en-US';
  version = '1.0';
  docId = '';

  constructor() {
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  init() {
    const self = this;
    const docData = document.getElementById('docData');
    if (docData) {
      this.docName = docData.getAttribute('data-docName');
      this.language = docData.getAttribute('data-language');
      this.version = docData.getAttribute('data-version');
      this.docId = docData.getAttribute('data-id');
    }

    const docLi = document.getElementById(this.docId);
    if (docLi) {
      docLi.classList.add('active');
      let parent = docLi.parentElement;

      while (parent) {
        if (parent.tagName === 'UL') {
          if (parent.classList.contains('root-list')) {
            break;
          }
          parent.classList.add('active');
        }
        if (parent.tagName === 'LI') {
          // 取相同层级的 class= caret
          const caret = parent.querySelector('.caret');
          if (caret) {
            caret.classList.add('caret-down');
          }
        }
        parent = parent.parentElement;
      }
    }

    // set selected value for version select
    const versionSelect = document.getElementById('versionSelect');
    if (versionSelect) {
      const options = versionSelect.querySelectorAll('option');
      options.forEach(option => {
        if (option.value === this.version) {
          option.selected = true;
        }
      });
    }

    document.getElementById('versionSelect')?.addEventListener('change', function () {
      const selectedValue = this.value;
      if (selectedValue != this.version) {
        self.redirectToVersion(selectedValue);
      }
    });

    var toggler = document.getElementsByClassName("caret");
    for (var i = 0; i < toggler.length; i++) {
      toggler[i].addEventListener("click", function () {
        this.parentElement.querySelector(".nested").classList.toggle("active");
        this.classList.toggle("caret-down");
      });
    }
  }

  selectLanguage(language) {
    if (language === this.language) {
      window.location.reload();
      return;
    }

    var url = new URL(window.location.href);
    var path = url.pathname;
    var htmlName = path.split('/').pop();
    url.pathname = `/docs/${this.docName}/${language}/${this.version}/${htmlName}`;

    // 判断新的url是否返回404
    fetch(url.href)
      .then(response => {
        if (response.status === 404) {
          alert(`The language ${language} is not available for this document.`);
          return;
        } else {
          window.location.href = url.href;
        }
      });
  }

  redirectToVersion(version) {
    var url = new URL(window.location.href);
    var path = url.pathname;
    var htmlName = path.split('/').pop();
    url.pathname = `/docs/${this.docName}/${this.language}/${version}/${htmlName}`;

    // 判断新的url是否返回404
    fetch(url.href)
      .then(response => {
        if (response.status === 404) {
          alert(`The version ${version} is not available for this document.`);
          return;
        } else {
          window.location.href = url.href;
        }
      });
  }

}
const doc = new Docs();


// interface UrlInfo {
//   url: string;
//   title: string;
// }
