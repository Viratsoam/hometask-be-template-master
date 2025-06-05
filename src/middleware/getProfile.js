const getProfile = async (req, res, next) => {
    const { Profile } = req.app.get('models');
    const profileId = req.get('profile_id');
  
    if (!profileId) return res.status(401).json({ error: 'Missing profile_id in headers' });
  
    const profile = await Profile.findOne({ where: { id: profileId } });
  
    if (!profile) return res.status(401).json({ error: 'Unauthorized: profile not found' });
  
    req.profile = profile;
    next();
  };
  
  module.exports = { getProfile };
  