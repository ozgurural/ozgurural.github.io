const LIKE_KEY_PREFIX = 'post-like:';
const COMMENT_KEY_PREFIX = 'post-comments:';

const isStorageAvailable = (() => {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return false;
    }

    const testKey = '__post_interactions__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
})();

const onDocumentReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
};

const formatTimestamp = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  try {
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return date.toLocaleString();
  }
};

const appendTextWithBreaks = (element, text) => {
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (index > 0) {
      element.appendChild(document.createElement('br'));
    }
    element.appendChild(document.createTextNode(line));
  });
};

const setStatusMessage = (statusElement, message, type) => {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;

  const errorClass = 'local-comments__status--error';
  const successClass = 'local-comments__status--success';
  statusElement.classList.remove(errorClass, successClass);

  if (type === 'error') {
    statusElement.classList.add(errorClass);
  } else if (type === 'success') {
    statusElement.classList.add(successClass);
  }
};

const initLikeButton = (container, postId) => {
  const likeButton = container.querySelector('[data-like-button]');
  const likeLabel = likeButton ? likeButton.querySelector('[data-like-label]') : null;
  const statusElement = container.querySelector('[data-like-status]');

  if (!likeButton || !likeLabel || !statusElement) {
    return;
  }

  const defaultLabel = likeLabel.textContent.trim() || 'Like';
  const likedLabel = likeLabel.dataset.likedLabel || 'Liked';
  const defaultStatus = statusElement.textContent.trim() || 'Likes are saved locally in this browser.';
  const likedStatus = statusElement.dataset.likedMessage || 'Thanks for liking this post! (Saved locally.)';
  const disabledStatus = statusElement.dataset.storageDisabled || 'Local browser storage is disabled, so likes are unavailable.';
  const errorStatus = statusElement.dataset.errorStorage || 'We could not save your like. Please check your browser settings and try again.';

  if (!isStorageAvailable) {
    likeButton.disabled = true;
    likeButton.setAttribute('aria-pressed', 'false');
    likeButton.classList.remove('post-interactions__like--active');
    likeLabel.textContent = defaultLabel;
    statusElement.textContent = disabledStatus;
    return;
  }

  const storageKey = `${LIKE_KEY_PREFIX}${postId}`;
  let liked = false;

  try {
    liked = window.localStorage.getItem(storageKey) === 'true';
  } catch (error) {
    liked = false;
  }

  const applyState = (isLiked) => {
    likeButton.setAttribute('aria-pressed', String(isLiked));
    likeButton.classList.toggle('post-interactions__like--active', isLiked);
    likeLabel.textContent = isLiked ? likedLabel : defaultLabel;
    statusElement.textContent = isLiked ? likedStatus : defaultStatus;
  };

  applyState(liked);

  likeButton.addEventListener('click', () => {
    const nextState = !liked;
    applyState(nextState);

    try {
      window.localStorage.setItem(storageKey, String(nextState));
      liked = nextState;
    } catch (error) {
      applyState(liked);
      statusElement.textContent = errorStatus;
    }
  });
};

const loadComments = (storageKey) => {
  if (!isStorageAvailable) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => {
      return entry && typeof entry.name === 'string' && typeof entry.message === 'string';
    });
  } catch (error) {
    return [];
  }
};

const saveComments = (storageKey, comments, statusElement) => {
  if (!isStorageAvailable) {
    return false;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(comments));
    return true;
  } catch (error) {
    setStatusMessage(statusElement, statusElement?.dataset.errorStorage || 'We could not save your comment. Check your browser storage settings and try again.', 'error');
    return false;
  }
};

const renderComments = (listElement, comments) => {
  listElement.innerHTML = '';

  if (!comments.length) {
    const emptyMessage = listElement.dataset.emptyLabel || 'No comments yet. Be the first to share your thoughts.';
    const emptyElement = document.createElement('p');
    emptyElement.className = 'local-comments__empty';
    emptyElement.textContent = emptyMessage;
    listElement.appendChild(emptyElement);
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement('article');
    item.className = 'local-comments__item';

    const meta = document.createElement('p');
    meta.className = 'local-comments__item-meta';
    const formattedDate = formatTimestamp(comment.timestamp);
    meta.textContent = formattedDate ? `${comment.name} • ${formattedDate}` : comment.name;
    item.appendChild(meta);

    const body = document.createElement('p');
    body.className = 'local-comments__item-body';
    appendTextWithBreaks(body, comment.message);
    item.appendChild(body);

    listElement.appendChild(item);
  });
};

const disableForm = (formElement) => {
  if (!formElement) {
    return;
  }

  const fields = formElement.querySelectorAll('input, textarea, button');
  fields.forEach((field) => {
    field.disabled = true;
  });
};

const initComments = (container, postId) => {
  const listElement = container.querySelector('[data-comment-list]');
  const formElement = container.querySelector('[data-comment-form]');
  const nameInput = container.querySelector('[data-comment-name]');
  const messageInput = container.querySelector('[data-comment-message]');
  const statusElement = container.querySelector('[data-comment-status]');

  if (!listElement || !formElement || !nameInput || !messageInput || !statusElement) {
    return;
  }

  const storageKey = `${COMMENT_KEY_PREFIX}${postId}`;

  if (!isStorageAvailable) {
    disableForm(formElement);
    setStatusMessage(statusElement, statusElement.dataset.storageDisabled || 'Local browser storage is disabled, so comments are unavailable.', 'error');
    renderComments(listElement, []);
    return;
  }

  let comments = loadComments(storageKey);
  renderComments(listElement, comments);

  formElement.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
      setStatusMessage(statusElement, statusElement.dataset.errorValidation || 'Please enter your name and a comment.', 'error');
      return;
    }

    const newComment = {
      name,
      message,
      timestamp: new Date().toISOString(),
    };

    comments = [...comments, newComment];

    if (!saveComments(storageKey, comments, statusElement)) {
      comments.pop();
      return;
    }

    renderComments(listElement, comments);
    formElement.reset();
    setStatusMessage(statusElement, statusElement.dataset.successMessage || 'Thanks for sharing your thoughts! (Saved locally.)', 'success');
  });
};

onDocumentReady(() => {
  const likeContainer = document.querySelector('.post-interactions[data-post-id]');
  const commentsContainer = document.querySelector('.local-comments[data-post-id]');

  const postId = likeContainer?.dataset.postId || commentsContainer?.dataset.postId;
  if (!postId) {
    return;
  }

  if (likeContainer) {
    initLikeButton(likeContainer, postId);
  }

  if (commentsContainer) {
    initComments(commentsContainer, postId);
  }
});
